import axios from "axios";

export default {
  name: "Brat",
  desc: "Brat text generator (HD quality)",
  category: "Maker",
  path: "/maker/brat?apikey=&text=",

  async run(req, res) {
    const { apikey, text } = req.query;

    // 🔐 Validasi apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!text) {
      return res.json({ status: false, error: "Missing parameter: text" });
    }

    try {
      // Ambil hasil dari API eksternal (langsung URL gambar)
      const apiUrl = `https://api-faa.my.id/faa/brathd?text=${encodeURIComponent(text)}`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      const image = Buffer.from(response.data, "binary");

      // Kirim hasil gambar ke client (PNG)
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