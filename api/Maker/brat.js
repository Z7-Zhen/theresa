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

      // 🩶 Background kertas putih (gradasi kecil biar nggak terlalu gede)
      const gradient = ctx.createRadialGradient(
        width * 0.3, // posisi lebih ke kiri atas
        height * 0.3,
        100,
        width * 0.3,
        height * 0.3,
        width * 0.6 // lebih kecil
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#f0f0f0");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 🌤️ Cahaya lembut di pojok kiri atas
      const lightGradient = ctx.createRadialGradient(
        width * 0.25,
        height * 0.2,
        50,
        width * 0.25,
        height * 0.2,
        width * 0.5
      );
      lightGradient.addColorStop(0, "rgba(255,255,255,0.8)");
      lightGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);

      // ✏️ Teks super besar di kiri atas
      const words = text.trim().split(/\s+/);
      let fontSize = 300; // lebih besar lagi
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "black";

      // 🔤 Kurangi ukuran jika keluar dari batas kanan
      while (true) {
        ctx.font = `bold ${fontSize}px SFProDisplay`;
        const metrics = ctx.measureText(text);
        if (metrics.width > width - 100 || fontSize * 1.2 > height - 100) {
          fontSize -= 8;
        } else break;
      }

      // ✂️ Bungkus teks biar tetap muat
      const lines = [];
      let currentLine = "";
      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 150 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else currentLine = testLine;
      }
      lines.push(currentLine);

      const lineHeight = fontSize * 1.05;
      const startX = 80; // agak menjorok ke kiri
      const startY = 100; // teks mulai dari atas

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
