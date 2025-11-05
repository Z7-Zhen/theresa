import { createCanvas, loadImage, registerFont } from "canvas";
import assets from "@putuofc/assetsku";

// 🪶 Register font CubestMedium
registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" });

export default {
  name: "WelcomeV2",
  desc: "Generate gambar Welcome Banner versi 2 (Cubest font)",
  category: "Canvas",
  path: "/canvas/welcomev2?apikey=&username=&guildName=&memberCount=&avatar=&background=",

  async run(req, res) {
    try {
      const { apikey, username, guildName, memberCount, avatar, background } = req.query;

      // 🔐 Validasi apikey (opsional jika pakai sistem global)
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.status(403).json({ status: false, error: "Apikey invalid" });
      }

      // ⚙️ Cek parameter wajib
      if (!username || !guildName || !memberCount || !avatar || !background) {
        return res.status(400).json({
          status: false,
          error: "Missing parameter: username, guildName, memberCount, avatar, background",
        });
      }

      // 🎨 Setup canvas
      const canvas = createCanvas(512, 256);
      const ctx = canvas.getContext("2d");
      const frame = assets.image.get("WELCOME2");

      // 🖼️ Load gambar (pakai fallback)
      const [bgImg, frameImg, avatarImg] = await Promise.all([
        loadImage(background).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
        loadImage(frame).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
        loadImage(avatar).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
      ]);

      // 🧱 Gambar dasar
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

      // 🖼️ Avatar miring
      ctx.save();
      ctx.beginPath();
      ctx.rotate((-17 * Math.PI) / 180);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.drawImage(avatarImg, -4, 110, 96, 96);
      ctx.strokeRect(-4, 110, 96, 96);
      ctx.restore();

      // 💬 Tulis teks
      const name = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName;
      ctx.globalAlpha = 1;
      ctx.font = "18px CubestMedium";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(name, 336, 158);

      ctx.font = "700 18px Courier New";
      ctx.textAlign = "left";
      ctx.fillText(`${memberCount}th member`, 214, 248);

      const usernameShort = username.length > 12 ? username.substring(0, 15) + "..." : username;
      ctx.font = "700 24px Courier New";
      ctx.fillText(usernameShort, 208, 212);

      // 📤 Kirim hasil buffer ke response
      const buffer = canvas.toBuffer("image/png");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", buffer.length);
      res.end(buffer);
    } catch (err) {
      console.error("[WELCOMEV2 ERROR]", err);
      res.status(500).json({ status: false, error: err.message });
    }
  },
};
