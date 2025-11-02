import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

/* 🔹 Fungsi utama OCR */
async function processOCR(filePath) {
  const url = "https://staging-ai-image-ocr-266i.frontend.encr.app/api/ocr/process";

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  const imageBase64 = fs.readFileSync(filePath).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();

  return {
    text: json.extractedText || "",
    confidence: json.confidence || null,
    lang: json.language || null,
  };
}

/* 🔹 Export fitur API */
export default [
  {
    name: "OCR",
    desc: "Ekstrak teks dari gambar menggunakan OCR otomatis",
    category: "Tools",
    path: "/tools/ocr?apikey=&image=",
    async run(req, res) {
      try {
        const { apikey, image } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });

        if (!image)
          return res.json({ status: false, error: "Image URL wajib diisi" });

        // 🔹 Path file sementara
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const tempPath = path.join(__dirname, `temp_ocr_${Date.now()}.jpg`);

        // 🔹 Download gambar
        const img = await axios.get(image, { responseType: "arraybuffer" });
        fs.writeFileSync(tempPath, img.data);

        // 🔹 Jalankan OCR
        const result = await processOCR(tempPath);

        // 🔹 Hapus file sementara
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        res.status(200).json({
          creator: "Z7:林企业",
          status: true,
          result,
        });
      } catch (err) {
        console.error("❌ OCR Error:", err.message);
        res.status(500).json({
          creator: "Z7:林企业",
          status: false,
          result: null,
          error: err.message,
        });
      }
    },
  },
];