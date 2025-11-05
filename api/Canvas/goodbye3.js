import axios from "axios"
import { fileTypeFromBuffer } from "file-type"
import { createCanvas, loadImage } from "canvas"
import assets from "@putuofc/assetsku"

declare const proxy: () => string | null

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/png",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }
  if (filename) headers["Content-Disposition"] = `inline; filename="${filename}"`
  return new Response(buffer, { headers })
}

async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer)
  return type !== undefined && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateGoodbyeImage(username: string, avatarBuffer: Buffer): Promise<Buffer> {
  const canvas = createCanvas(650, 300)
  const ctx = canvas.getContext("2d")

  const bg = assets.image.get("GOODBYE3")
  const [background, avatarImg] = await Promise.all([
    loadImage(bg),
    loadImage(avatarBuffer),
  ])

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

  // Avatar circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(325, 150, 75, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(avatarImg, 250, 75, 150, 150)
  ctx.restore()

  // Username text
  const nameShort = username.length > 12 ? username.substring(0, 12) + "..." : username
  ctx.font = "bold 45px Courier New"
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.fillText(nameShort, 325, 275)

  return canvas.toBuffer("image/png")
}

export default {
  name: "GoodbyeV3",
  desc: "Generate Goodbye Banner versi 3 (Canvas-style, GET query or POST file upload)",
  category: "Canvas",
  path: "/canvas/goodbyev3?username=&avatar=",

  async run(req, res) {
    try {
      const { username, avatar } = req.query

      if (!username || !avatar) {
        return res.status(400).json({ status: false, error: "Missing required parameters: username or avatar" })
      }

      try {
        const response = await axios.get(proxy() + avatar, { responseType: "arraybuffer" })
        const avatarBuffer = Buffer.from(response.data)

        if (!(await isValidImageBuffer(avatarBuffer))) {
          return res.status(400).json({
            status: false,
            error: "Invalid avatar image type. Supported types: PNG, JPEG, JPG, WEBP, GIF",
          })
        }

        const img = await generateGoodbyeImage(username, avatarBuffer)
        return createImageResponse(img)
      } catch (err: any) {
        return res.status(500).json({ status: false, error: err.message })
      }
    } catch (err: any) {
      return res.status(500).json({ status: false, error: err.message })
    }
  },
}
