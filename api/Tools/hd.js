import axios from 'axios';
import FormData from 'form-data';

export default {
  name: "Enhance Image",
  desc: "Enhance gambar dari URL menggunakan AI EnhanceIt",
  category: "Tools",
  path: "/tools/enhanceimage?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "URL gambar wajib diisi" });
    }

    try {
      // Unduh gambar dari URL
      const { data } = await axios.get(url, { responseType: 'arraybuffer' });

      // Kirim ke EnhanceIt
      const form = new FormData();
      form.append('file', Buffer.from(data), { filename: 'image.jpg' });

      const response = await axios.post('https://enhanceit.pro/proxy-1.php', form, {
        headers: form.getHeaders(),
      });

      if (!response.data?.output_url) {
        return res.json({ status: false, error: "Gagal memproses gambar." });
      }

      res.json({
        status: true,
        message: "Gambar berhasil di-enhance!",
        result: response.data.output_url,
      });

    } catch (error) {
      console.error("Gagal Enhance:", error.message);
      res.status(500).json({ status: false, error: error.message });
    }
  },
};