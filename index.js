const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 4000;

// ===== Discord Bot Settings =====
const DISCORD_BOT_TOKEN = 'MTQzMTE4NDc5NDQ0MzU4MzU5OA.G_B0gl.0eqzmixSgX57c9onFnD1uAAGoxgWNFtpFPgeFw';
const DISCORD_CHANNEL_ID = '1430590323893080237';
// ===== Setup Discord Bot =====
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});
let discordReady = false;

discordClient.once('ready', () => {
    discordReady = true;
    console.log(chalk.greenBright(`Discord Bot logged in as ${discordClient.user.tag}`));
    sendDiscordNotification('🟢 Server started. Discord Bot is online.');
});

discordClient.login(DISCORD_BOT_TOKEN);

// ===== Fungsi kirim notifikasi ke Discord =====
async function sendDiscordNotification(message) {
    if (!discordReady || !message) return;
    try {
        const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
        if (!channel) return;
        if (typeof message === 'string') {
            await channel.send({ content: message });
        } else if (message.embeds) {
            await channel.send(message);
        }
    } catch (err) {
        console.error(chalk.redBright(`[DiscordNotificationError] ${err.message}`));
    }
}

// ===== Fungsi log canggih ke Discord =====
async function sendDiscordLog({ ip, method, endpoint, status, query, duration }) {
    if (!discordReady) return;
    try {
        const icons = { request: '🟡', success: '✅', error: '❌' };
        const colors = { request: 0x7289da, success: 0x57f287, error: 0xed4245 };

        const embed = new EmbedBuilder()
            .setTitle(`${icons[status] || 'ℹ️'} API Activity - ${status.toUpperCase()}`)
            .setColor(colors[status] || 0x99aab5)
            .addFields(
                { name: 'IP', value: `\`${ip}\``, inline: true },
                { name: 'Method', value: method, inline: true },
                { name: 'Endpoint', value: endpoint, inline: false },
                { name: 'Query', value: `\`\`\`json\n${JSON.stringify(query || {}, null, 2)}\n\`\`\``, inline: false },
                { name: 'Duration (ms)', value: duration ? duration.toString() : '-', inline: true },
                { name: 'Time', value: new Date().toISOString(), inline: false }
            )
            .setFooter({ text: "Theresa API's Log System ✨" })
            .setTimestamp();

        await sendDiscordNotification({ embeds: [embed] });
    } catch (err) {
        console.error(chalk.red(`[DiscordLogError] ${err.message}`));
    }
}

// ===== Setup Express =====
app.enable('trust proxy');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.set('json spaces', 2);

// ===== Static Files =====
app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// ===== Load OpenAPI Settings =====
const openApiPath = path.join(__dirname, './src/openapi.json');
let openApi = {};
try {
    openApi = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
} catch (err) {
    console.warn(chalk.yellowBright('⚠️  openapi.json not found or invalid JSON.'));
}

// ===== Route khusus untuk openapi.json =====
app.get('/openapi.json', (req, res) => {
    if (fs.existsSync(openApiPath)) {
        res.sendFile(openApiPath);
    } else {
        res.status(404).json({ status: false, message: 'openapi.json tidak ditemukan' });
    }
});

// ===== Helper: Cek apakah path cocok dengan OpenAPI =====
function matchOpenApiPath(requestPath) {
    const paths = Object.keys(openApi.paths || {});
    for (const apiPath of paths) {
        const regexPath = apiPath.replace(/{[^}]+}/g, '[^/]+');
        const regex = new RegExp(`^${regexPath}$`);
        if (regex.test(requestPath)) return true;
    }
    return false;
}

// ===== Middleware JSON Response =====
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status ?? true,
                creator: openApi.info?.author || 'Created Using Rynn UI',
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// ===== Middleware Monitor Endpoint =====
const endpointStats = {};

app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const method = req.method;
    const endpoint = req.originalUrl.split('?')[0];
    const query = req.query;
    const startTime = Date.now();

    try {
        if (matchOpenApiPath(endpoint)) {
            await sendDiscordLog({ ip, method, endpoint, status: 'request', query });
            console.log(chalk.yellow(`🟡 [REQUEST] ${method} ${endpoint} | IP: ${ip}`));
        }

        next();

        res.on('finish', async () => {
            if (!matchOpenApiPath(endpoint)) return;

            const duration = Date.now() - startTime;
            const isError = res.statusCode >= 400;
            const status = isError ? 'error' : 'success';

            if (!endpointStats[endpoint]) endpointStats[endpoint] = { total: 0, totalDuration: 0, errors: 0 };
            endpointStats[endpoint].total += 1;
            endpointStats[endpoint].totalDuration += duration;
            if (isError) endpointStats[endpoint].errors += 1;
            const avgDuration = (endpointStats[endpoint].totalDuration / endpointStats[endpoint].total).toFixed(2);

            await sendDiscordLog({ ip, method, endpoint, status, query, duration });
            console.log(chalk[isError ? 'red' : 'green'](
                `${isError ? '❌' : '✅'} [${status.toUpperCase()}] ${method} ${endpoint} | ${res.statusCode} | ${duration}ms (Avg: ${avgDuration}ms) | Total: ${endpointStats[endpoint].total} | Errors: ${endpointStats[endpoint].errors}`
            ));
        });
    } catch (err) {
        console.error(chalk.red(`❌ [ERROR Middleware] ${err.message}`));
        res.status(500).json({ status: false, message: 'Internal middleware error' });
    }
});

// ===== Load API Routes =====
let totalRoutes = 0;
const apiFolder = path.join(__dirname, './src/api');

if (fs.existsSync(apiFolder)) {
    fs.readdirSync(apiFolder).forEach(subfolder => {
        const subfolderPath = path.join(apiFolder, subfolder);
        if (fs.statSync(subfolderPath).isDirectory()) {
            fs.readdirSync(subfolderPath).forEach(file => {
                if (path.extname(file) === '.js') {
                    const filePath = path.join(subfolderPath, file);
                    try {
                        const route = require(filePath);
                        if (typeof route === 'function') route(app);
                        totalRoutes++;
                        console.log(chalk.bgYellowBright.black(`Loaded Route: ${file}`));
                        sendDiscordNotification(`✅ Loaded Route: ${file}`);
                    } catch (err) {
                        console.error(chalk.bgRedBright.black(`Failed to load route ${file}: ${err.message}`));
                        sendDiscordNotification(`❌ Failed to load route ${file}: ${err.message}`);
                    }
                }
            });
        }
    });
}

console.log(chalk.bgGreenBright.black('Load Complete! ✓'));
console.log(chalk.bgGreenBright.black(`Total Routes Loaded: ${totalRoutes}`));
sendDiscordNotification(`🟢 Server started. Total Routes Loaded: ${totalRoutes}`);

// ===== Routes =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'api-page', 'index.html')));
app.get('/docs', (req, res) => res.sendFile(path.join(__dirname, 'api-page', 'docs.html')));

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'api-page', '404.html'));
});

// 500 handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    sendDiscordNotification(`🚨 Server Error: ${err.message}`);
    res.status(500).sendFile(path.join(__dirname, 'api-page', '500.html'));
});

// ===== Start Server =====
app.listen(PORT, () => {
    console.log(chalk.bgGreenBright.black(`Server is running on port ${PORT}`));
});
