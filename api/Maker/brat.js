import { createCanvas, registerFont, loadImage } from "canvas";
import path from "path";
import { fileURLToPath } from "url";

// 🔧 Setup __dirname untuk ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🆕 Daftarkan font utama + emoji font fallback
registerFont(path.join(__dirname, "../../assets/fonts/SFPRODISPLAYREGULAR.OTF"), {
  family: "SFProDisplay",
});
registerFont(path.join(__dirname, "../../assets/fonts/NotoColorEmoji.ttf"), {
  family: "NotoColorEmoji",
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

      // 📄 Background kertas putih lembut (HD)
      const gradient = ctx.createRadialGradient(width * 0.3, height * 0.3, 100, width * 0.3, height * 0.3, width * 0.6);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#f2f2f2");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ☀️ Efek cahaya lembut di kiri atas
      const lightGradient = ctx.createRadialGradient(width * 0.25, height * 0.2, 50, width * 0.25, height * 0.2, width * 0.5);
      lightGradient.addColorStop(0, "rgba(255,255,255,0.8)");
      lightGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = lightGradient;
      ctx.fillRect(0, 0, width, height);

      // 🖋️ Konfigurasi teks dasar
      let fontSize = 400;
      const minFontSize = 180;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#000";

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

      // 🔁 Resize agar teks muat sempurna
      while (fontSize > minFontSize) {
        ctx.font = `bold ${fontSize}px SFProDisplay, NotoColorEmoji`;
        const lines = wrapText(ctx, text, width - 150);
        const totalHeight = lines.length * fontSize * 1.05;
        if (totalHeight < height - 150) break;
        fontSize -= 10;
      }

      ctx.font = `bold ${fontSize}px SFProDisplay, NotoColorEmoji`;
      const lines = wrapText(ctx, text, width - 150);
      const lineHeight = fontSize * 1.05;
      const startX = 80;
      const startY = 100;

      // 🖍️ Render teks dengan Twemoji CDN untuk emoji
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let x = startX;

        for (const char of [...line]) {
          if (/\p{Emoji}/u.test(char)) {
            try {
              // 🧩 Ambil emoji dari Twemoji CDN
              const codePoints = [...char].map(c => c.codePointAt(0).toString(16)).join("-");
              const emojiUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints}.png`;

              const emojiImg = await loadImage(emojiUrl);
              const size = fontSize * 0.9;
              ctx.drawImage(emojiImg, x, startY + i * lineHeight, size, size);
              x += size * 0.9;
            } catch (err) {
              // fallback: emoji font biasa
              ctx.fillText(char, x, startY + i * lineHeight);
              x += ctx.measureText(char).width;
            }
          } else {
            ctx.fillText(char, x, startY + i * lineHeight);
            x += ctx.measureText(char).width;
          }
        }
      }

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
