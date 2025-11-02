import axios from "axios";

export default {
  name: "NSFW",
  desc: "Random NSFW anime 18+",
  category: "Random",
  path: "/random/nsfw?apikey=",

  async run(req, res) {
    const { apikey } = req.query;

    // 🔐 Validasi API key
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      const types = ["blowjob", "neko", "trap", "waifu"];
      const selected = types[Math.floor(Math.random() * types.length)];

      // Ambil data JSON dari waifu.pics
      const { data } = await axios.get(`https://api.waifu.pics/nsfw/${selected}`);

      // Ambil gambar dalam bentuk buffer binary
      const imgRes = await axios.get(data.url, { responseType: "arraybuffer" });
      const image = Buffer.from(imgRes.data, "binary");

      // Kirim langsung gambar
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