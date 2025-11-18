const axios = require("axios");
const https = require("https");
const FormData = require("form-data");

const httpsAgent = new https.Agent({ rejectUnauthorized: true });

// Hilangkan emoji dari string
function removeEmoji(str) {
  return str.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, "").trim();
}

// Hanya hapus emoji dari object top-level (parse=false)
function sanitizeTopLevel(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = {};
  for (const key in obj) out[removeEmoji(key)] = obj[key];
  return out;
}

// Parse object lengkap jika parse=true
function obj(x) {
  if (Array.isArray(x)) return x.map(v => obj(v));
  if (x && typeof x === "object") {
    const out = {};
    for (const key in x) out[key.replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu, "").trim().replace(/\s+/g, "_")] = obj(x[key]);
    return out;
  }
  return x;
}

// Ambil nonce dari halaman
async function getNonce(url) {
  const html = (await axios.get(url, { httpsAgent })).data;
  const m = html.match(/var\s+terabox_ajax\s*=\s*(\{[\s\S]*?\});/m);
  if (!m) return null;
  try {
    return JSON.parse(m[1]).nonce ?? null;
  } catch {
    return null;
  }
}

module.exports = function(app) {
  // Endpoint GET /download/terabox?url=<link>&parse=<true|false>
  app.get("/download/terabox", async (req, res) => {
    const link = req.query.url;
    const parseResult = req.query.parse === "true";

    if (!link) return res.status(400).json({ error: true, message: "Query parameter 'url' is required" });

    try {
      const nonce = await getNonce("https://teradownloadr.com/");
      if (!nonce) throw new Error("Gagal mendapatkan nonce");

      const form = new FormData();
      form.append("action", "terabox_fetch");
      form.append("url", link);
      form.append("nonce", nonce);

      const { data } = await axios.post(
        "https://teradownloadr.com/wp-admin/admin-ajax.php",
        form,
        { headers: form.getHeaders(), httpsAgent, timeout: 30000 }
      );

      const result = parseResult ? obj(data.data) : sanitizeTopLevel(data.data);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: true, message: err.message });
    }
  });
};