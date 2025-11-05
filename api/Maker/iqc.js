import { createCanvas, loadImage } from "canvas";

export default {
  name: "IQC",
  desc: "Generate gambar IQC dengan teks (posisi kiri) dan jam otomatis",
  category: "Maker",
  path: "/maker/iqc?apikey=&text=",

  async run(req, res) {
    const { apikey, text } = req.query;

    // 🔐 Validasi apikey
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!text) {
      return res.json({ status: false, error: "Missing parameter: text" });
    }

    try {
      // Ambil jam server saat request
      const now = new Date();
      const jam = now.toLocaleTimeString("en-GB", { hour12: false }); // HH:MM:SS

      let kata = text.split(" ");
      if (kata.length >= 6) {
        const splitIndex = Math.ceil(kata.length / 2);
        const baris1 = kata.slice(0, splitIndex).join(" ");
        const baris2 = kata.slice(splitIndex).join(" ");
        text = baris1 + "\n" + baris2;
      }

      const canvas = createCanvas(864, 1536);
      const ctx = canvas.getContext("2d");

      // ===== Template Kiri =====
      const kiriBg = kata.length < 5
        ? "https://raw.githubusercontent.com/Zephyr-crack/scrapes/main/iqckiri1.png"
        : "https://raw.githubusercontent.com/Zephyr-crack/scrapes/main/iqckiri2.png";

      const bg = await loadImage(kiriBg);
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      if (kata.length < 5) {
        ctx.font = "28px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "top";
        ctx.fillText(text, 62, 768);

        ctx.font = "bold 26px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(jam, 380, 10);

        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText(jam, 390, 787);
      } else {
        ctx.font = "28px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "top";
        ctx.fillText(text, 67, 470);

        ctx.font = "bold 26px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(jam, 385, 11);

        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText(jam, 587, 517);
      }

      // ===== Kirim gambar ke client =====
      const buffer = canvas.toBuffer("image/jpeg");
      res.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Content-Length": buffer.length
      });
      res.end(buffer);

    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: err.message });
    }
  },
};
