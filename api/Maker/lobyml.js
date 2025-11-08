import axios from 'axios'
import { createCanvas, loadImage, registerFont } from 'canvas'
import fs from 'fs'
import path from 'path'

async function generateLobbyML(username, imageUrl) {
  try {
    // Unduh font jika belum ada
    const tmpDir = process.cwd()
    const fontUrl = 'https://www.fuku-cloud.my.id/upload/z0gvtn.ttf'
    const fontPath = path.join(tmpDir, 'z0gvtn.ttf')

    if (!fs.existsSync(fontPath)) {
      const fontFile = await axios.get(fontUrl, { responseType: 'arraybuffer' })
      fs.writeFileSync(fontPath, Buffer.from(fontFile.data))
    }

    registerFont(fontPath, { family: 'CustomFont' })

    // Unduh gambar user dan layer
    const userImage = await loadImage(imageUrl)
    const bg = await loadImage('https://www.fuku-cloud.my.id/upload/2akeq0.jpeg')
    const frameOverlay = await loadImage('https://www.fuku-cloud.my.id/upload/rkwlf1.jpeg')

    // Canvas setup
    const canvas = createCanvas(bg.width, bg.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height)

    // Posisi & ukuran avatar
    const avatarSize = 205
    const frameSize = 293
    const centerX = (canvas.width - frameSize) / 2
    const centerY = (canvas.height - frameSize) / 2 - 282
    const avatarX = centerX + (frameSize - avatarSize) / 2
    const avatarY = centerY + (frameSize - avatarSize) / 2 - 3

    const { width, height } = userImage
    const minSide = Math.min(width, height)
    const cropX = (width - minSide) / 2
    const cropY = (height - minSide) / 2

    ctx.drawImage(userImage, cropX, cropY, minSide, minSide, avatarX, avatarY, avatarSize, avatarSize)
    ctx.drawImage(frameOverlay, centerX, centerY, frameSize, frameSize)

    // Nickname text
    const nickname = username.trim()
    const maxFontSize = 36
    const minFontSize = 24
    const maxChar = 11
    let fontSize = maxFontSize

    if (nickname.length > maxChar) {
      const excess = nickname.length - maxChar
      fontSize -= excess * 2
      if (fontSize < minFontSize) fontSize = minFontSize
    }

    ctx.font = `${fontSize}px CustomFont`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.fillText(nickname, canvas.width / 2 + 13, centerY + frameSize + 15)

    return canvas.toBuffer('image/png')
  } catch (err) {
    console.error(err)
    throw new Error('Gagal membuat gambar Lobby MLBB.')
  }
}

export default {
  name: "Lobby MLBB",
  desc: "Membuat gambar lobby MLBB dengan nama dan avatar custom.",
  category: "Maker",
  path: "/maker/lobyml?apikey=&username=&image=",
  async run(req, res) {
    const { apikey, username, image } = req.query

    // Validasi apikey
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.status(403).json({
        status: false,
        message: "Apikey tidak valid!"
      })
    }

    // Validasi input
    if (!username) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'username' wajib diisi!"
      })
    }

    if (!image) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'image' wajib diisi (URL gambar)."
      })
    }

    try {
      const result = await generateLobbyML(username, image)

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="lobby_ml_${username}.png"`,
      })
      res.end(result)
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      })
    }
  }
}
