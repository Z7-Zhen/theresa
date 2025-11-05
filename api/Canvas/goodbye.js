import { createCanvas, loadImage, registerFont } from "canvas"
import assets from "@putuofc/assetsku"
import axios from "axios"
import { fileTypeFromBuffer } from "file-type"

// 🪶 Register font Bold
registerFont(assets.font.get("THEBOLDFONT"), { family: "Bold" })

const proxy = () => null // optional proxy helper

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/jpeg",
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
  guildIcon: string | Buffer,
  memberCount: number,
  avatar: string | Buffer,
  background: string | Buffer,
  quality: number,
) {
  const canvas = createCanvas(1024, 450)
  const ctx = canvas.getContext("2d")

  const bg = await loadImage(await processImage(background))
  const frame = await loadImage(assets.image.get("GOODBYE"))
  const av = await loadImage(await processImage(avatar))
  const guildIco = await loadImage(await processImage(guildIcon))

  // Background
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)

  // Username
  ctx.globalAlpha = 1
  ctx.font = "45px Bold"
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(username, 130, canvas.height - 60)

  // Member Count
  ctx.font = "22px Bold"
  ctx.fillText(`- ${memberCount}th member !`, 90, canvas.height - 15)

  // Guild Name
  const name = guildName.length > 13 ? guildName.substring(0, 10) + "..." : guildName
  ctx.font = "45px Bold"
  ctx.fillText(name, canvas.width - 225, canvas.height - 44)

  // Avatar circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(180, 160, 110, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(av, 45, 40, 270, 270)
  ctx.restore()

  // Guild Icon circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(canvas.width - 150, canvas.height - 200, 80, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(guildIco, canvas.width - 230, canvas.height - 280, 160, 160)
  ctx.restore()

  return canvas.toBuffer("image/jpeg", { quality: quality / 100 })
}

export default {
  name: "GoodbyeV1",
  desc: "Generate gambar Goodbye Banner versi 1 (Canvas-style, Bold font)",
  category: "Canvas",
  path: "/canvas/goodbyev1?apikey=&username=&guildName=&memberCount=&avatar=&guildIcon=&background=&quality=",

  async run(req, res) {
    try {
      const { apikey, username, guildName, memberCount, avatar, guildIcon, background } = req.query
      let quality = parseInt(req.query.quality as string) || 100

      // Validasi parameter
      if (!apikey || !global.apikey?.includes(apikey)) return res.status(403).json({ status: false, error: "Apikey invalid" })
      if (!username || !guildName || !memberCount || !avatar || !guildIcon || !background)
        return res.status(400).json({ status: false, error: "Missing required parameters" })
      if (!isValidImageUrl(avatar) || !isValidImageUrl(guildIcon) || !isValidImageUrl(background))
        return res.status(400).json({ status: false, error: "Invalid image URL" })

      const img = await generateGoodbyeImage(
        username,
        guildName,
        guildIcon,
        parseInt(memberCount),
        avatar,
        background,
        quality,
      )

      return createImageResponse(img)
    } catch (err: any) {
      console.error("[CANVAS GOODBYEV1 ERROR]", err)
      res.status(500).json({ status: false, error: err.message })
    }
  },
}
