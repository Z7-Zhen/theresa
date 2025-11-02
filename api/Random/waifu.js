import axios from "axios";

export default {
  name: "Waifu",
  desc: "Random waifu beautiful",
  category: "Random",
  path: "/random/waifu?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

    // 🔐 Validasi apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      // Ambil data JSON dari API waifu.pics
      const { data } = await axios.get("https://api.waifu.pics/sfw/waifu");

      // Ambil gambar dari URL
      const imgRes = await axios.get(data.url, { responseType: "arraybuffer" });
      const image = Buffer.from(imgRes.data, "binary");

      // Kirim gambar langsung (binary)
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": image.length,
      });
      res.end(image);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  },
};