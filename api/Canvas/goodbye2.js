import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"
import axios from "axios"
import { fileTypeFromBuffer } from "file-type"

// Register font
registerFont(assets.font.get("CUBESTMEDIUM"), { family: "CubestMedium" })

const proxy = () => null

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }
  if (filename) headers["Content-Disposition"] = `inline; filename="${filename}"`
  return new Response(buffer, { headers })
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => path.endsWith(ext))
  } catch {
    return false
  }
}

async function processImage(image: string | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(image)) return image
  if (typeof image === "string") {
    const res = await axios.get(proxy() + image, { responseType: "arraybuffer" })
    return Buffer.from(res.data)
  }
  throw new Error("Invalid image format")
}

async function generateGoodbyeImage(
  username: string,
  guildName: string,
  memberCount: number,
  avatar: string | Buffer,
  background: string | Buffer,
): Promise<Buffer> {
  const canvas = createCanvas(512, 256)
  const ctx = canvas.getContext("2d")
  const frame = assets.image.get("GOODBYE2")

  const [bgImg, frameImg, avatarImg] = await Promise.all([
    loadImage(await processImage(background)),
    loadImage(frame),
    loadImage(await processImage(avatar)),
  ])

  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height)

  // Avatar rotated
  ctx.save()
  ctx.beginPath()
  ctx.rotate((-17 * Math.PI) / 180)
  ctx.drawImage(avatarImg, -4, 110, 96, 96)
  ctx.strokeStyle = "#fff"
  ctx.lineWidth = 3
  ctx.strokeRect(-4, 110, 96, 96)
  ctx.restore()

  // Guild Name
  const shortGuild = guildName.length > 10 ? guildName.substring(0, 10) + "..." : guildName
  ctx.font = "18px CubestMedium"
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(shortGuild, 336, 158)

  // Member Count
  ctx.font = "700 18px Courier New"
  ctx.textAlign = "left"
  ctx.fillText(`${memberCount}th member`, 214, 248)

  // Username
  const shortUser = username.length > 12 ? username.substring(0, 15) + "..." : username
  ctx.font = "700 24px Courier New"
  ctx.fillText(shortUser, 208, 212)

  return canvas.toBuffer("image/png")
}

export default {
  name: "GoodbyeV2",
  desc: "Generate Goodbye Banner versi 2 (Canvas-style, Rotated avatar)",
  category: "Canvas",
  path: "/canvas/goodbyev2?apikey=&username=&guildName=&memberCount=&avatar=&background=",

  async run(req, res) {
    try {
      const { apikey, username, guildName, memberCount, avatar, background } = req.query

      if (!apikey || !global.apikey?.includes(apikey)) return res.status(403).json({ status: false, error: "Apikey invalid" })
      if (!username || !guildName || !memberCount || !avatar || !background)
        return res.status(400).json({ status: false, error: "Missing required parameters" })
      if (!isValidImageUrl(avatar) || !isValidImageUrl(background))
        return res.status(400).json({ status: false, error: "Invalid image URL" })

      const img = await generateGoodbyeImage(
        username,
        guildName,
        parseInt(memberCount),
        avatar,
        background,
      )

      return createImageResponse(img)
    } catch (err: any) {
      console.error("[CANVAS GOODBYEV2 ERROR]", err)
      res.status(500).json({ status: false, error: err.message })
    }
  },
}
