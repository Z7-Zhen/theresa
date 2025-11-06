import { createCanvas, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";

// 🔧 Setup __dirname untuk ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🆕 Daftarkan font SF Pro Display Regular
registerFont(path.join(__dirname, "../../assets/fonts/SFPRODISPLAYREGULAR.OTF"), {
  family: "SFProDisplay",
});

export default {
  name: "Brat",
  desc: "Brat text generator",
  category: "Maker",
  path: "/maker/brat?apikey=&text=",

  async run(req, res) {
    const { apikey, text } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!text) {
      return res.json({ status: false, error: "Missing parameter: text" });
    }

    try {
      const width = 1024;
      const height = 1024;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🩶 Background kertas putih (gradasi kecil di kiri atas)
      const gradient = ctx.createRadialGradient(width * 0.3, height * 0.3, 100, width * 0.3, height * 0.3, width * 0.6);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#f0f0f0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 🌤️ Cahaya lembut di pojok kiri atas
      const lightGradient = ctx.createRadialGradient(width * 0.25, height * 0.2, 50, width * 0.25, height * 0.2, width * 0.5);
      lightGradient.addColorStop(0, "rgba(255,255,255,0.8)");
      lightGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);

      // ✏️ Teks besar di kiri atas
      const words = text.trim().split(/\s+/);
      let fontSize = 400; // target utama 400px
      const minFontSize = 180; // batas minimum supaya tidak kecil banget
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "black";

      // Fungsi untuk membungkus teks agar muat di canvas
      const wrapText = (ctx, text, maxWidth) => {
        const words = text.split(" ");
        const lines = [];
        let line = "";
        for (let word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line) {
            lines.push(line);
            line = word;
          } else line = testLine;
        }
        lines.push(line);
        return lines;
      };

      // 🧠 Coba font-size 400px, kecilkan jika terlalu tinggi
      while (fontSize > minFontSize) {
        ctx.font = `bold ${fontSize}px SFProDisplay`;
        const lines = wrapText(ctx, text, width - 150);
        const lineHeight = fontSize * 1.05;
        const totalHeight = lines.length * lineHeight;
        if (totalHeight < height - 150) break; // cukup muat
        fontSize -= 10; // kurangi perlahan
      }

      // 🔁 Bungkus ulang dengan ukuran akhir
      ctx.font = `bold ${fontSize}px SFProDisplay`;
      const lines = wrapText(ctx, text, width - 150);
      const lineHeight = fontSize * 1.05;
      const startX = 80;
      const startY = 100;

      lines.forEach((line, i) => {
        ctx.fillText(line, startX, startY + i * lineHeight);
      });

      // 📦 Output PNG
      const buffer = canvas.toBuffer("image/png");
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: err.message });
    }
  },
};
