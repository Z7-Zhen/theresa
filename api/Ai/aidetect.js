import axios from "axios";

/**
 * 🔍 Analisis kode sumber menggunakan codedetector.io
 * Bisa kirim langsung teks code atau URL RAW (GitHub Gist, Pastebin, dll)
 *
 * Contoh:
 *   /ai/analyzer?url=https://pastebin.com/raw/xyz
 *   /ai/analyzer?code=console.log('Hello')
 */

async function analyzer({ code, url } = {}) {
  try {
    if (!code && !url) {
      return { error: "Butuh code atau url nya lah bree..." };
    }

    if (url) {
      const lower = url.toLowerCase();
      const isRaw =
        lower.includes("/raw") ||
        lower.includes("raw.githubusercontent") ||
        lower.includes("pastebin.com/raw");

      if (!isRaw) {
        return { error: "URL tidak mengarah ke RAW content. Tambahin /raw di URL bree..." };
      }

      try {
        const fetched = await axios.get(url);
        code = fetched.data;
      } catch (err) {
        return { error: `Gagal mengambil konten dari URL: ${err.message}` };
      }
    }

    if (!code) return { error: "Code kosong bree..." };

    const { data } = await axios.post("https://codedetector.io/api/analyze", { code });
    return data;
  } catch (e) {
    return { error: e.message };
  }
}

/* === FITUR API TANPA API KEY === */
export default {
  name: "Code Analyzer",
  desc: "Analisis source code via codedetector.io",
  category: "AI",
  path: "/ai/analyzer?url=&code=",

  async run(req, res) {
    try {
      const { url, code } = req.query;

      // Minimal salah satu wajib
      if (!url && !code)
        return res.json({ status: false, error: "Masukkan url RAW atau code" });

      const result = await analyzer({ code, url });

      if (result.error)
        return res.json({ status: false, error: result.error });

      res.status(200).json({
        status: true,
        source: "codedetector.io",
        input: url ? { type: "url", value: url } : { type: "code", value: "[inline code]" },
        result
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
