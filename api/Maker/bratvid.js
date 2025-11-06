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
  name: "BratVideo",
  desc: "Brat animated text generator (HD one-frame preview)",
  category: "Maker",
  path: "/maker/bratvideo?apikey=&text=",

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
      const width = 1024;
      const height = 1024;
      const frameCount = 30;
      const i = Math.floor(Math.random() * frameCount); // acak frame (simulasi animasi)

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🎨 Background kertas putih HD dengan gradasi lembut
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        150,
        width / 2,
        height / 2,
        width / 1.2
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#f3f3f3");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 🌤️ Tambahkan cahaya lembut di atas
      const lightGradient = ctx.createRadialGradient(
        width / 2,
        height / 3,
        80,
        width / 2,
        height / 3,
        width / 1.5
      );
      lightGradient.addColorStop(0, "rgba(255,255,255,0.7)");
      lightGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);

      // 🖋️ Tulis teks dengan font SF Pro Display
      ctx.fillStyle = "black";
      ctx.font = "bold 96px SFProDisplay";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 🔤 Bungkus teks
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";
      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 100 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else currentLine = testLine;
      }
      lines.push(currentLine);

      // 🎞️ Efek "goyang lembut" seperti animasi
      const lineHeight = 110;
      const offsetAmp = 10; // amplitudo goyangan
      const startY = (height - (lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        const offsetY =
          Math.sin(((i + index * 3) / frameCount) * Math.PI * 2) * offsetAmp;
        ctx.fillText(line, width / 2, startY + index * lineHeight + offsetY);
      });

      // 📦 Output buffer
      const buffer = canvas.toBuffer("image/png");

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
