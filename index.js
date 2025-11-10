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
const PORT = process.env.PORT || 8000;

// ===== Discord Webhook =====
const DISCORD_WEBHOOKS = [
  process.env.DISCORD_WEBHOOK || "https://discord.com/api/webhooks/1433251978791878669/DZ5HKcB9VMtMWgvBjszczCaEQ8jCpOS_qskHuh5uBtYiH7NyMqgqPvC_4-HmxFU53lQ9"
];

async function sendToDiscord(embed) {
  if (!DISCORD_WEBHOOKS.length) return;
  for (const webhook of DISCORD_WEBHOOKS) {
    try {
      const payload = {
        username: "Theresa API Monitor 🚀",
        avatar_url: "https://files.catbox.moe/j4kh57.jpg",
        embeds: Array.isArray(embed) ? embed : [embed]
      };
      await axios.post(webhook, payload);
    } catch (err) {
      console.log(chalk.bgRed.white(`⚠ Failed Discord webhook (${webhook}): ${err.response?.status || "-"} | ${err.response?.data || err.message}`));
    }
  }
}

// ===== Discord Log Function =====
async function sendDiscordLog({ ip, method, endpoint, status, query, duration }) {
  try {
    const icons = { request: "🟡", success: "✅", error: "❌" };
    const colors = { request: 0x7289da, success: 0x57f287, error: 0xed4245 };
    await sendToDiscord({
      title: `${icons[status] || "ℹ️"} API Activity - ${status.toUpperCase()}`,
      color: colors[status] || 0x99aab5,
      fields: [
        { name: "IP", value: `\`${ip}\``, inline: true },
        { name: "Method", value: method, inline: true },
        { name: "Endpoint", value: endpoint },
        { name: "Query", value: `\`\`\`json\n${JSON.stringify(query || {}, null, 2)}\n\`\`\`` },
        { name: "Duration (ms)", value: duration ? duration.toString() : "-", inline: true },
        { name: "Time", value: new Date().toISOString(), inline: false }
      ],
      footer: { text: "Theresa API's Log System ✨" },
      timestamp: new Date()
    });
  } catch (err) {
    console.log(chalk.red(`[DiscordLogError] ${err.message}`));
  }
}

// ===== Middleware =====
app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.set("json spaces", 2);

const bannedIps = ["127.0.0.1", "0.0.0.0", "localhost", "192.168.", "10.0.0."];
const endpointStats = {};

app.use(async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  const method = req.method;
  const endpoint = req.originalUrl.split("?")[0];
  const query = req.query;
  const startTime = Date.now();

  const sendLog = async (status, color, msg = '') => {
    await sendToDiscord({
      title: `🔐 API Access Detected${msg ? ` | ${msg}` : ""}`,
      color,
      fields: [
        { name: "IP Address", value: `\`${ip}\``, inline: true },
        { name: "Method", value: method, inline: true },
        { name: "Endpoint", value: endpoint },
        { name: "Status", value: status, inline: true },
        { name: "Time", value: new Date().toISOString(), inline: true },
      ],
      footer: { text: `Theresa APIs | @Z7:林企业 🌟` },
      timestamp: new Date()
    });
  };

  try {
    // ⛔ Banned IP
    if (bannedIps.some(b => ip.includes(b))) {
      await sendLog("blocked", 0xed4245, "Banned IP");
      return res.status(403).json({ status: false, message: "Access denied: banned IP" });
    }

    // 🔹 Kirim log request
    await sendDiscordLog({ ip, method, endpoint, status: "request", query });
    console.log(chalk.yellow(`🟡 [REQUEST] ${method} ${endpoint} | IP: ${ip}`));

    next();

    res.on("finish", async () => {
      const duration = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      const status = isError ? "error" : "success";
      const color = isError ? 0xed4245 : 0x57f287;

      // Statistik endpoint
      if (!endpointStats[endpoint]) endpointStats[endpoint] = { total: 0, totalDuration: 0, errors: 0 };
      endpointStats[endpoint].total += 1;
      endpointStats[endpoint].totalDuration += duration;
      if (isError) endpointStats[endpoint].errors += 1;
      const avgDuration = (endpointStats[endpoint].totalDuration / endpointStats[endpoint].total).toFixed(2);

      await sendDiscordLog({ ip, method, endpoint, status, query, duration });
      console.log(chalk[isError ? "red" : "green"](
        `${isError ? "❌" : "✅"} [${status.toUpperCase()}] ${method} ${endpoint} | ${res.statusCode} | ${duration}ms (Avg: ${avgDuration}ms) | Total: ${endpointStats[endpoint].total} | Errors: ${endpointStats[endpoint].errors}`
      ));
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(chalk.red(`❌ [ERROR Middleware] ${err.message}`));
    await sendDiscordLog({ ip, method, endpoint, status: "error", query, duration });
    res.status(500).json({ status: false, message: "Internal middleware error" });
  }
});

// ===== Global Helpers =====
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
global.totalreq = 0;

// ===== Metadata =====
const settings = {
  creatorName: "Z7:林企业",
  apiTitle: "Theresa API's",
  channelLink: "https://whatsapp.com/channel/0029VbBt4432f3ENa8ULoM1J",
  githubLink: "https://github.com/Reyz2902",
  contactLink: "https://t.me/ReyzID12"
};

// ===== JSON Wrapper =====
app.use((req, res, next) => {
  global.totalreq++;
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (typeof data === "object" && !["/endpoints", "/set", "/stats"].includes(req.path)) {
      return originalJson({ creator: settings.creatorName, ...data });
    }
    return originalJson(data);
  };
  next();
});

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

// ===== Dynamic API Loader =====
let rawEndpoints = {};
const loadedRoutes = new Map();

async function loadApiFolder(folder) {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) await loadApiFolder(fullPath);
    else if (file.endsWith(".js")) await loadRoute(fullPath, file);
  }
}

async function loadRoute(fullPath, file) {
  try {
    const fileUrl = `file://${fullPath}?update=${Date.now()}`;
    if (loadedRoutes.has(fullPath)) {
      const { path: oldPath, category } = loadedRoutes.get(fullPath);
      app._router.stack = app._router.stack.filter(r => r.route?.path !== oldPath);
      if (rawEndpoints[category]) {
        rawEndpoints[category] = rawEndpoints[category].filter(r => r.path !== oldPath);
        if (!rawEndpoints[category].length) delete rawEndpoints[category];
      }
    }

    const { default: routes } = await import(fileUrl);
    const handlers = Array.isArray(routes) ? routes : [routes];
    handlers.forEach(route => {
      const { name, desc, category, path: routePath, run } = route;
      if (name && desc && category && routePath && typeof run === "function") {
        const cleanPath = routePath.split("?")[0];
        app.get(cleanPath, run);
        if (!rawEndpoints[category]) rawEndpoints[category] = [];
        rawEndpoints[category].push({ name, desc, path: routePath });
        loadedRoutes.set(fullPath, { path: cleanPath, category, name, desc });
        console.log(chalk.hex("#55efc4")(`✔ Loaded:`), chalk.hex("#ffeaa7")(cleanPath));
      }
    });
  } catch (err) {
    console.error(chalk.bgRed.white(`❌ Error in ${file}: ${err.message}`));
  }
}

// ===== Load API & Hot Reload =====
await loadApiFolder(path.join(__dirname, "api"));
const watcher = chokidar.watch(path.join(__dirname, "api"), { ignoreInitial: true });
watcher.on("add", async p => await loadRoute(p, path.basename(p)));
watcher.on("change", async p => await loadRoute(p, path.basename(p)));
watcher.on("unlink", async p => {
  if (loadedRoutes.has(p)) {
    const { path: routePath, category } = loadedRoutes.get(p);
    app._router.stack = app._router.stack.filter(r => r.route?.path !== routePath);
    loadedRoutes.delete(p);
    if (rawEndpoints[category]) {
      rawEndpoints[category] = rawEndpoints[category].filter(r => r.path !== routePath);
      if (!rawEndpoints[category].length) delete rawEndpoints[category];
    }
  }
});

// ===== Endpoint Listing & Homepage =====
app.get("/endpoints", (req, res) => {
  const sorted = Object.keys(rawEndpoints)
    .sort()
    .reduce((acc, cat) => {
      acc[cat] = rawEndpoints[cat].sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    }, {});
  res.json(sorted);
});

// ======= Favicon =======
app.get("/favicon.ico", (req, res) => res.sendStatus(204));

// ======= Homepage =======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ======= Start Server =======
app.listen(PORT, async () => {
  console.log(chalk.white(`• Server running at http://localhost:${PORT}`));
  await sendToDiscord({
    title: "🚀 Theresa API's Started",
    color: 3447003,
    fields: [
      { name: "Port", value: `${PORT}`, inline: true },
      { name: "Creator", value: settings.creatorName, inline: true },
    ],
    timestamp: new Date()
  });
});

export default app;


