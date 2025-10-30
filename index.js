import express from 'express';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Global Helpers
global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.apikey = process.env.APIKEY || null;
global.totalreq = 0;

// Settings
const settings = {
  creatorName: "Z7:林企业",
  apiTitle: "Theresa API's",
  channelLink: "https://whatsapp.com/channel/0029VbBHTVqBKfiADKhkOh0Q", 
  githubLink: "https://github.com/Reyz2902", 
  contactLink: "https://t.me/ReyzID12"
};

// JSON Response Wrapper
app.use((req, res, next) => {
  global.totalreq += 1;
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (typeof data === 'object' && req.path !== '/endpoints' && req.path !== '/set') {
      return originalJson({ creator: settings.creatorName || "Created Using Skyzo", ...data });
    }
    return originalJson(data);
  };
  next();
});

app.get('/set', (req, res) => res.json(settings));

// ===== Dynamic API loader =====
let rawEndpoints = {};
const loadedRoutes = new Map(); // { filePath: { path, category, name, desc } }

async function loadApiFolder(folder) {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await loadApiFolder(fullPath);
    } else if (file.endsWith('.js')) {
      await loadRoute(fullPath, file);
    }
  }
}

async function loadRoute(fullPath, file) {
  try {
    const fileUrl = `file://${fullPath}?update=${Date.now()}`;

    // Remove old route if exists
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
      if (name && desc && category && routePath && typeof run === 'function') {
        const cleanPath = routePath.split('?')[0];
        app.get(cleanPath, run);

        if (!rawEndpoints[category]) rawEndpoints[category] = [];
        rawEndpoints[category].push({ name, desc, path: routePath });

        loadedRoutes.set(fullPath, { path: cleanPath, category, name, desc });

        console.log(chalk.hex('#55efc4')(`✔ Loaded: `) + chalk.hex('#ffeaa7')(`${cleanPath} (${file})`));
      } else {
        console.warn(chalk.bgRed.white(` ⚠ Skipped invalid route in ${file}`));
      }
    });
  } catch (err) {
    console.error(chalk.bgRed.white(` ❌ Error in ${file}: ${err.message}`));
  }
}

// Load all API routes initially
await loadApiFolder(path.join(__dirname, 'api'));

// ===== Hot-reload watcher =====
const watcher = chokidar.watch(path.join(__dirname, 'api'), { ignoreInitial: true });

watcher.on('add', async pathFile => {
  console.log(chalk.blue(`✨ New file detected: ${pathFile}, loading...`));
  await loadRoute(pathFile, path.basename(pathFile));
});

watcher.on('change', async pathFile => {
  console.log(chalk.yellow(`♻ File changed: ${pathFile}, reloading...`));
  await loadRoute(pathFile, path.basename(pathFile));
});

watcher.on('unlink', async pathFile => {
  console.log(chalk.red(`❌ File deleted: ${pathFile}, removing routes...`));
  if (loadedRoutes.has(pathFile)) {
    const { path: routePath, category } = loadedRoutes.get(pathFile);
    app._router.stack = app._router.stack.filter(r => r.route?.path !== routePath);
    loadedRoutes.delete(pathFile);
    if (rawEndpoints[category]) {
      rawEndpoints[category] = rawEndpoints[category].filter(r => r.path !== routePath);
      if (!rawEndpoints[category].length) delete rawEndpoints[category];
    }
  }
});

// ===== Endpoint listing =====
app.get('/endpoints', (req, res) => {
  const sortedEndpoints = Object.keys(rawEndpoints)
    .sort((a, b) => a.localeCompare(b))
    .reduce((sorted, category) => {
      sorted[category] = rawEndpoints[category].sort((a, b) => a.name.localeCompare(b.name));
      return sorted;
    }, {});
  res.json(sortedEndpoints);
});

app.get('/', (req, res) => {
  try { res.sendFile(path.join(__dirname, 'index.html')); } 
  catch (err) { console.log(err); }
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.white(`• Server is running http://localhost:${PORT}`));
});

export default app;
