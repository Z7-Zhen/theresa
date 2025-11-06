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
  desc: "Brat text generator (HD paper background)",
  category: "Maker",
  path: "/maker/brat?apikey=&text=",

  async run(req, res) {
    const { apikey, text } = req.query;

    // 🔐 Validasi API key
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!text) {
      return res.json({ status: false, error: "Missing parameter: text" });
    }

    try {
      // 🎨 Buat canvas HD
      const width = 1024;
      const height = 1024;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🩶 Background kertas putih HD (gradasi halus)
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        100,
        width / 2,
        height / 2,
        width / 1.2
      );
      gradient.addColorStop(0, "#ffffff"); // putih tengah
      gradient.addColorStop(1, "#f2f2f2"); // abu muda di pinggir
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 🌤️ Tambah efek lembut seperti cahaya
      const lightGradient = ctx.createRadialGradient(
        width / 2,
        height / 3,
        50,
        width / 2,
        height / 3,
        width / 2
      );
      lightGradient.addColorStop(0, "rgba(255,255,255,0.6)");
      lightGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);

      // 🖋️ Teks hitam dengan font custom
      ctx.fillStyle = "black";
      ctx.font = "bold 96px SFProDisplay";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 🔤 Bungkus teks biar gak keluar
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";
      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 80 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else currentLine = testLine;
      }
      lines.push(currentLine);

      // 🧭 Posisi teks vertikal tengah
      const lineHeight = 110;
      const startY = (height - (lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, width / 2, startY + i * lineHeight);
      });

      // 📦 Hasilkan buffer gambar PNG
      const imageBuffer = canvas.toBuffer("image/png");

      // 🚀 Kirim ke client
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.length,
      });
      res.end(imageBuffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
