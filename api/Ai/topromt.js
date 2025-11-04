import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * 🔹 Fungsi utama — ubah gambar (via URL) menjadi prompt teks AI
 * @param {string} imageUrl - URL gambar online
 * @returns {Promise<object>} - Hasil prompt dari API imageprompt.org
 */
export async function topromptUrl(imageUrl) {
  try {
    // 🔸 Download gambar dari URL
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const base64Url = Buffer.from(response.data).toString("base64");

    // 🔸 Kirim ke imageprompt.org
    const { data } = await axios.post(
      "https://imageprompt.org/api/ai/prompts/image",
      {
        base64Url,
        imageModelId: 0,
        language: "id"
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    return data;
  } catch (e) {
    throw e.response?.data || { error: e.message };
  }
}

/**
 * 🔹 Route handler
 * Format: /ai/toprompt?apikey=&url=
 */
export default {
  name: "AI Image → Prompt (URL)",
  desc: "Generate deskripsi prompt dari gambar URL (via imageprompt.org)",
  category: "AI",
  path: "/ai/toprompt?apikey=&url=",
  async run(req, res) {
    try {
      const { apikey, url } = req.query;

      // 🔒 Validasi apikey
      if (!global.apikey?.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      // 🔒 Validasi URL
      if (!url)
        return res.json({ status: false, error: "Parameter url diperlukan" });

      // 🔹 Jalankan fungsi utama
      const result = await topromptUrl(url);

      res.status(200).json({
        status: true,
        source: "imageprompt.org",
        input: url,
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message || error
      });
    }
  }
};