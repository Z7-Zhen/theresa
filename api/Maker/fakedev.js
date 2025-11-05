import axios from "axios";
import { createCanvas, loadImage } from "canvas";

export default {
  name: "FakeDev",
  desc: "Generate fake developer image with optional verified badge",
  category: "Maker",
  path: "/maker/fakedev?apikey=&name=&imageUrl=&verified=",

  async run(req, res) {
    try {
      const { name, verified = "false", imageUrl } = req.query;

      // Validasi parameter
      if (!name) {
        return res.status(400).json({
          status: false,
          creator: "Z7:林企业",
          message: "Parameter 'name' wajib diisi",
        });
      }

      if (!imageUrl) {
        return res.status(400).json({
          status: false,
          creator: "Z7:林企业",
          message: "Parameter 'imageUrl' wajib diisi",
        });
      }

      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          status: false,
          creator: "Z7:林企业",
          message: "Parameter 'name' harus berupa string non-kosong",
        });
      }

      if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
        return res.status(400).json({
          status: false,
          creator: "Z7:林企业",
          message: "Parameter 'imageUrl' harus berupa string non-kosong",
        });
      }

      const isVerified = verified.toLowerCase() === "true";

      // Ambil background
      const bgResponse = await axios.get(
        "https://raw.githubusercontent.com/NimeAssistent/Kazumaa/main/uploader/0866b15068.jpg",
        { responseType: "arraybuffer" }
      );
      const bgBuffer = Buffer.from(bgResponse.data, "binary");

      // Ambil foto user
      const userImageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      const userImageBuffer = userImageResponse.data;

      // Ambil badge verified jika aktif
      let verifiedBuffer = null;
      if (isVerified) {
        const verifiedResponse = await axios.get(
          "https://raw.githubusercontent.com/NimeAssistent/Kazumaa/main/uploader/da639adc5d.png",
          { responseType: "arraybuffer" }
        );
        verifiedBuffer = Buffer.from(verifiedResponse.data, "binary");
      }

      const backgroundImage = await loadImage(bgBuffer);
      const userImage = await loadImage(userImageBuffer);
      let verifiedImage = null;

      if (isVerified && verifiedBuffer) {
        verifiedImage = await loadImage(verifiedBuffer);
      }

      // Setup canvas
      const canvas = createCanvas(backgroundImage.width, backgroundImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

      // Gambar profil (lingkaran)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.25;

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const aspectRatio = userImage.width / userImage.height;
      let imgWidth = radius * 2;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > radius * 2) {
        imgHeight = radius * 2;
        imgWidth = imgHeight * aspectRatio;
      }

      ctx.drawImage(
        userImage,
        centerX - imgWidth / 2,
        centerY - imgHeight / 2,
        imgWidth,
        imgHeight
      );
      ctx.restore();

      // Efek bayangan
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      // Teks nama
      ctx.font = "bold 42px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const textOffsetX = -30;
      ctx.fillText(name, centerX + textOffsetX, centerY + radius + 80);

      // Gambar verified badge
      if (isVerified && verifiedImage) {
        const badgeSize = 100;
        const textWidth = ctx.measureText(name).width;
        const badgeX = centerX + textOffsetX + textWidth / 2 + 15;
        const badgeY = centerY + radius + 80;
        const textHeight = 42;
        const verticalOffset = (textHeight - badgeSize) / 2;

        ctx.drawImage(
          verifiedImage,
          badgeX - badgeSize / 2,
          badgeY + verticalOffset,
          badgeSize,
          badgeSize
        );
      }

      // Kirim hasil ke klien
      const buffer = canvas.toBuffer("image/png");
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        message: error.message || "Terjadi kesalahan internal",
      });
    }
  },
};
