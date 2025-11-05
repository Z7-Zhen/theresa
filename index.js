import express from 'express';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3022;
const HOST = "0.0.0.0"; // 🌍 Akses publik VPS

// ===== DISCORD WEBHOOK =====
const DISCORD_WEBHOOKS = [
  process.env.DISCORD_WEBHOOK || "https://discord.com/api/webhooks/1433251978791878669/DZ5HKcB9VMtMWgvBjszczCaEQ8jCpOS_qskHuh5uBtYiH7NyMqgqPvC_4-HmxFU53lQ9"
];

async function sendToDiscord(embed) {
  for (const webhook of DISCORD_WEBHOOKS) {
    try {
      await axios.post(webhook, {
        username: "Theresa API Monitor 🚀",
        avatar_url: "https://files.catbox.moe/j4kh57.jpg",
        embeds: Array.isArray(embed) ? embed : [embed]
      });
    } catch (err) {
      console.log(
        chalk.bgRed.white(
          `⚠️ Failed Discord webhook (${webhook}): ${err.response?.status || "-"} | ${JSON.stringify(err.response?.data || err.message)}`
        )
      );
    }
  }
}

// ===== GLOBAL HELPERS =====
global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios.get(url, { ...options, responseType: "arraybuffer" });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, ...options });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.apikey = process.env.APIKEY || null;

// ===== METADATA =====
const settings = {
  creatorName: "Z7:林企业",
  apiTitle: "Theresa API's",
  githubLink: "https://github.com/Reyz2902",
  contactLink: "https://t.me/ReyzID12"
};

// ===== MIDDLEWARE & AUTO BLOCK =====
app.enable("trust proxy");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("json spaces", 2);

const bannedIps = new Set(["0.0.0.0"]); // Permanen
const tempBlockIps = {};                 // Sementara
const MAX_ERRORS = 5;
const BLOCK_DURATION = 60 * 60 * 1000; // 1 jam
const endpointStats = {};

app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "";
  const method = req.method;
  const endpoint = req.originalUrl.split("?")[0];
  const start = Date.now();

  // Cek banned permanen
  if (bannedIps.has(ip)) {
    console.log(chalk.red(`🚫 [BLOCKED] ${ip} tried to access ${endpoint}`));
    return res.status(403).json({ status: false, message: "Access denied: banned IP" });
  }

  // Cek banned sementara
  if (tempBlockIps[ip] && Date.now() < tempBlockIps[ip].expires) {
    console.log(chalk.red(`🚫 [TEMP BLOCK] ${ip} tried to access ${endpoint}`));
    return res.status(403).json({ status: false, message: "Access temporarily blocked" });
  } else if (tempBlockIps[ip]) {
    delete tempBlockIps[ip]; // unblock expired
  }

  console.log(chalk.yellow(`🟡 [REQUEST] ${method} ${endpoint} | IP: ${ip}`));

  res.on("finish", () => {
    const ms = Date.now() - start;
    const isError = res.statusCode >= 400;
    const status = isError ? "❌ ERROR" : "✅ OK";
    const color = isError ? "red" : "green";
    console.log(chalk[color](`${status} [${method}] ${endpoint} (${res.statusCode}) - ${ms}ms`));

    // Update stats
    endpointStats[endpoint] ??= { total: 0, errors: 0, totalDuration: 0 };
    endpointStats[endpoint].total++;
    endpointStats[endpoint].totalDuration += ms;
    if (isError) endpointStats[endpoint].errors++;

    // ===== AUTO BLOCK =====
    if (isError) {
      tempBlockIps[ip] ??= { count: 0, expires: 0 };
      tempBlockIps[ip].count++;
      if (tempBlockIps[ip].count >= MAX_ERRORS) {
        tempBlockIps[ip].expires = Date.now() + BLOCK_DURATION;
        console.log(chalk.bgRed.white(`⚠️ [AUTO BLOCK] ${ip} blocked for ${BLOCK_DURATION / 60000} minutes due to repeated errors.`));
      }
    }
  });

  next();
});

// ===== JSON WRAPPER =====
app.use((req, res, next) => {
  const oldJson = res.json.bind(res);
  res.json = (data) => {
    if (typeof data === "object" && !["/endpoints", "/stats", "/set"].includes(req.path)) {
      return oldJson({ creator: settings.creatorName, ...data });
    }
    return oldJson(data);
  };
  next();
});

// ===== SIMPLE ROUTES =====
app.get("/set", (req, res) => res.json(settings));
app.get("/stats", (req, res) => {
  const stats = Object.entries(endpointStats).map(([path, data]) => ({
    endpoint: path,
    totalRequests: data.total,
    averageDuration: (data.totalDuration / data.total).toFixed(2),
    errorCount: data.errors
  }));
  res.json({ creator: settings.creatorName, stats });
});

// ===== DYNAMIC API LOADER =====
let rawEndpoints = {};
const loadedRoutes = new Map();

async function loadApiFolder(folder) {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) await loadApiFolder(fullPath);
    else if (file.endsWith(".js")) await loadRoute(fullPath);
  }
}

async function loadRoute(fullPath) {
  try {
    const fileUrl = `file://${fullPath}?v=${Date.now()}`;
    const { default: route } = await import(fileUrl);

    if (loadedRoutes.has(fullPath)) {
      const { routePath } = loadedRoutes.get(fullPath);
      app._router.stack = app._router.stack.filter(r => r.route?.path !== routePath);
      loadedRoutes.delete(fullPath);
    }

    const handlers = Array.isArray(route) ? route : [route];
    for (const h of handlers) {
      const { name, desc, category, path: routePath, run } = h;
      if (name && routePath && typeof run === "function") {
        app.get(routePath.split("?")[0], run);
        loadedRoutes.set(fullPath, { routePath, category });
        rawEndpoints[category] ??= [];
        rawEndpoints[category].push({ name, desc, path: routePath });
        console.log(chalk.green(`✔ Loaded ${routePath}`));
      }
    }
  } catch (err) {
    console.error(chalk.red(`❌ Failed to load ${fullPath}: ${err.message}`));
  }
}

await loadApiFolder(path.join(__dirname, "api"));

// ===== HOT RELOAD =====
const watcher = chokidar.watch(path.join(__dirname, "api"), { ignoreInitial: true });
watcher.on("change", async p => await loadRoute(p));
watcher.on("add", async p => await loadRoute(p));
watcher.on("unlink", p => {
  if (loadedRoutes.has(p)) {
    const { routePath, category } = loadedRoutes.get(p);
    app._router.stack = app._router.stack.filter(r => r.route?.path !== routePath);
    loadedRoutes.delete(p);
    rawEndpoints[category] = rawEndpoints[category]?.filter(r => r.path !== routePath);
  }
});

// ===== ENDPOINT LIST & HOMEPAGE =====
app.get("/endpoints", (req, res) => res.json(rawEndpoints));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/favicon.ico", (_, res) => res.sendStatus(204));

// ===== START SERVER =====
app.listen(PORT, HOST, async () => {
  console.log(chalk.cyan(`🚀 Theresa API's running on:`));
  console.log(chalk.green(`   ➤ http://${HOST}:${PORT}`));
  console.log(chalk.gray(`   (Access via VPS IP: http://YOUR_VPS_IP:${PORT})`));

  await sendToDiscord({
    title: "🚀 Theresa API's Started",
    color: 0x57f287,
    fields: [
      { name: "Port", value: `${PORT}`, inline: true },
      { name: "Creator", value: settings.creatorName, inline: true },
    ],
    timestamp: new Date()
  });                                                   });
