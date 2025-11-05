import * as canvafy from "canvafy"
import { fileTypeFromBuffer } from "file-type"

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

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => path.endsWith(ext))
  } catch {
    return false
  }
}

async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
  const type = await fileTypeFromBuffer(buffer)
  return type !== undefined && ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type.mime)
}

async function generateGoodbyeImageUrl(avatar: string, background: string, description: string) {
  return await new canvafy.WelcomeLeave()
    .setAvatar(proxy() + avatar)
    .setBackground("image", proxy() + background)
    .setTitle("Goodbye")
    .setDescription(description)
    .setBorder("#2a2e35")
    .setAvatarBorder("#2a2e35")
    .setOverlayOpacity(0.3)
    .build()
}

async function generateGoodbyeImageFile(avatarBuffer: Buffer, backgroundBuffer: Buffer, description: string) {
  return await new canvafy.WelcomeLeave()
    .setAvatar(avatarBuffer)
    .setBackground("image", backgroundBuffer)
    .setTitle("Goodbye")
    .setDescription(description)
    .setBorder("#2a2e35")
    .setAvatarBorder("#2a2e35")
    .setOverlayOpacity(0.3)
    .build()
}

export default {
  name: "GoodbyeV4",
  desc: "Generate Goodbye Banner versi 4 menggunakan Canvafy (Canvas-style, GET URL & POST file)",
  category: "Canvas",
  path: "/canvas/goodbyev4?avatar=&background=&description=",

  async run(req, res) {
    try {
      const { avatar, background, description } = req.query || {}

      if (!avatar || !background || !description) {
        return res.status(400).json({ status: false, error: "Missing required parameters: avatar, background, or description" })
      }

      if (!isValidImageUrl(avatar) || !isValidImageUrl(background)) {
        return res.status(400).json({
          status: false,
          error: "Invalid image URL. Supported types: JPG, JPEG, PNG, GIF, WEBP",
        })
      }

      try {
        const image = await generateGoodbyeImageUrl(avatar.trim(), background.trim(), description.trim())
        return createImageResponse(image)
      } catch (err: any) {
        return res.status(500).json({ status: false, error: err.message })
      }
    } catch (err: any) {
      return res.status(500).json({ status: false, error: err.message })
    }
  },
}
