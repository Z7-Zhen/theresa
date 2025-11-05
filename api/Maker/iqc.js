import { createCanvas, loadImage } from "canvas";

export default {
  name: "IQC",
  desc: "Generate gambar IQC dengan teks (posisi kiri) dan jam otomatis",
  category: "Maker",
  path: "/maker/iqc?apikey=&text=",

  async run(req, res) {
    try {
      const { apikey, text } = req.query;

      // 🔐 Validasi apikey
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.status(403).json({ status: false, error: "Apikey invalid" });
      }

      if (!text) {
        return res.status(400).json({ status: false, error: "Missing parameter: text" });
      }

      // 🕒 Ambil jam server saat request (format 24 jam)
      const now = new Date();
      const jam = now.toLocaleTimeString("en-GB", { hour12: false });

      // 💬 Pecah teks jika panjang
      const kata = text.trim().split(/\s+/);
      let teksFinal = text;

      if (kata.length >= 6) {
        const splitIndex = Math.ceil(kata.length / 2);
        const baris1 = kata.slice(0, splitIndex).join(" ");
        const baris2 = kata.slice(splitIndex).join(" ");
        teksFinal = `${baris1}\n${baris2}`;
      }

      // 🎨 Buat canvas
      const canvas = createCanvas(864, 1536);
      const ctx = canvas.getContext("2d");

      // 🖼️ Pilih background sesuai panjang teks
      const kiriBg =
        kata.length < 5
          ? "https://raw.githubusercontent.com/Zephyr-crack/scrapes/main/iqckiri1.png"
          : "https://raw.githubusercontent.com/Zephyr-crack/scrapes/main/iqckiri2.png";

      const bg = await loadImage(kiriBg);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // ✍️ Atur gaya teks & posisi
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "top";
      ctx.font = "28px sans-serif";

      if (kata.length < 5) {
        drawMultilineText(ctx, teksFinal, 62, 768, 740, 32);
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(jam, 380, 10);
        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText(jam, 390, 787);
      } else {
        drawMultilineText(ctx, teksFinal, 67, 470, 740, 32);
        ctx.font = "bold 26px sans-serif";
        ctx.fillText(jam, 385, 11);
        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText(jam, 587, 517);
      }

      // 📤 Kirim hasil
      const buffer = canvas.toBuffer("image/jpeg");
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Content-Length", buffer.length);
      res.end(buffer);

    } catch (err) {
      console.error("[IQC ERROR]", err);
      res.status(500).json({ status: false, error: err.message });
    }
  },
};

/**
 * 🧩 Fungsi bantu untuk menggambar teks multiline otomatis
 */
function drawMultilineText(ctx, text, x, y, maxWidth, lineHeight) {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight, maxWidth);
  }
}
