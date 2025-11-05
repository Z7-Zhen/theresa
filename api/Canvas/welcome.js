import axios from "axios";
import { fileTypeFromBuffer } from "file-type";
import { createCanvas, loadImage, registerFont } from "canvas";
import assets from "@putuofc/assetsku";

// ⚙️ Proxy helper (biar bisa lewat URL proxy bila ada)
const proxy = () => null;

// 🪶 Daftarkan font CubestMedium
registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" });

/**
 * 🔧 Helper untuk validasi URL gambar
 */
function isValidImageUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return validExtensions.some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * 🔧 Helper untuk validasi buffer gambar
 */
async function isValidImageBuffer(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  return (
    type !== undefined &&
    ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
  );
}

/**
 * 🎨 Fungsi utama untuk generate gambar welcome dari URL
 */
async function generateWelcomeV2ImageFromURL(username, guildName, memberCount, avatar, background) {
  const canvas = createCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  const fram = assets.image.get("WELCOME2");

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage((proxy() || "") + background).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(fram).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
    loadImage((proxy() || "") + avatar).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ]);

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.rotate((-17 * Math.PI) / 180);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.drawImage(avatarImg, -4, 110, 96, 96);
  ctx.strokeRect(-4, 110, 96, 96);
  ctx.restore();

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

  return canvas.toBuffer("image/png");
}

/**
 * 🎨 Versi kedua: Generate dari file upload
 */
async function generateWelcomeV2ImageFromFile(username, guildName, memberCount, avatarBuffer, backgroundBuffer) {
  const canvas = createCanvas(512, 256);
  const ctx = canvas.getContext("2d");
  const fram = assets.image.get("WELCOME2");

  const [backgroundImg, framImg, avatarImg] = await Promise.all([
    loadImage(backgroundBuffer).catch(() => loadImage(assets.image.get("DEFAULT_BG"))),
    loadImage(fram).catch(() => loadImage(assets.image.get("DEFAULT_FRAME"))),
    loadImage(avatarBuffer).catch(() => loadImage(assets.image.get("DEFAULT_AVATAR"))),
  ]);

  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  ctx.drawImage(framImg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.beginPath();
  ctx.rotate((-17 * Math.PI) / 180);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.drawImage(avatarImg, -4, 110, 96, 96);
  ctx.strokeRect(-4, 110, 96, 96);
  ctx.restore();

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

  return canvas.toBuffer("image/png");
}

/**
 * 🧾 Helper untuk kirim hasil gambar ke Response
 */
function createImageResponse(buffer, filename = null) {
  const headers = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  };

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`;
  }

  return new Response(buffer, { headers });
}

/**
 * 📦 Export fitur (ESM-style)
 */
export default [
  {
    method: "GET",
    endpoint: "/canvas/welcomev2",
    name: "Welcome v2",
    category: "Canvas",
    description: "Generate a welcome banner image (v2) via URL query.",
    example:
      "?username=John&guildName=Siputzx%20Api&memberCount=150&avatar=https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg&background=https://i.ibb.co/4YBNyvP/images-76.jpg",
    isPublic: true,

    async run({ req }) {
      const { username, guildName, memberCount, avatar, background } = req.query || {};

      if (!username || !guildName || !memberCount || !avatar || !background)
        return { status: false, error: "Missing required parameters.", code: 400 };

      if (!isValidImageUrl(avatar) || !isValidImageUrl(background))
        return { status: false, error: "Invalid image URL format.", code: 400 };

      try {
        const img = await generateWelcomeV2ImageFromURL(
          username,
          guildName,
          parseInt(memberCount),
          avatar,
          background
        );
        return createImageResponse(img);
      } catch (err) {
        return { status: false, error: err.message, code: 500 };
      }
    },
  },
  {
    method: "POST",
    endpoint: "/canvas/welcomev2",
    name: "Welcome v2 (Upload)",
    category: "Canvas",
    description: "Generate a welcome banner from uploaded files.",
    isPublic: true,

    async run({ req, guf }) {
      const { username, guildName, memberCount } = req.body || {};
      const avatarFile = await guf(req, "avatar");
      const backgroundFile = await guf(req, "background");

      if (!avatarFile || !backgroundFile)
        return { status: false, error: "Avatar & background files are required.", code: 400 };

      try {
        const img = await generateWelcomeV2ImageFromFile(
          username,
          guildName,
          parseInt(memberCount),
          avatarFile.file,
          backgroundFile.file
        );
        return createImageResponse(img);
      } catch (err) {
        return { status: false, error: err.message, code: 500 };
      }
    },
  },
];
