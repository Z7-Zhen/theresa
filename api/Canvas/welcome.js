import Canvas from "canvas";

export default {
  name: "Welcome",
  desc: "Generate custom welcome banner image (no default avatar/background)",
  category: "Canvas",
  path: "/canvas/welcome?apikey=&name=&avatar=&member=&text=&background=",
  async run(req, res) {
    const {
      apikey,
      name = "User",
      avatar,
      member = "100",
      text = "Welcome to the group!",
      background
    } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!avatar || !background)
      return res.json({
        status: false,
        error: "Parameter avatar dan background wajib diisi!"
      });

    try {
      // Load background & avatar
      const bg = await Canvas.loadImage(background);
      const ava = await Canvas.loadImage(avatar);

      // Buat canvas
      const canvas = Canvas.createCanvas(900, 500);
      const ctx = canvas.getContext("2d");

      // Gambar background
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Overlay semi gelap
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Avatar (bulat)
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 250, 100, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(ava, 50, 150, 200, 200);
      ctx.restore();

      // Teks "WELCOME"
      ctx.font = "bold 55px Sans";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 8;
      ctx.fillText("WELCOME", 600, 180);

      // Nama user
      ctx.font = "bold 40px Sans";
      ctx.fillStyle = "#00ffcc";
      ctx.fillText(name, 600, 250);

      // Teks custom
      ctx.font = "28px Sans";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, 600, 300);

      // Member count
      ctx.font = "24px Sans";
      ctx.fillStyle = "#ffd700";
      ctx.fillText(`Member #${member}`, 600, 350);

      // Output hasil buffer
      const buffer = canvas.toBuffer("image/png");

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length
      });
      res.end(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, error: error.message });
    }
  }
};