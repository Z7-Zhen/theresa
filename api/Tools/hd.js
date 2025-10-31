import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export default {
  name: "Enhance Image",
  desc: "Enhance (perjelas) gambar secara otomatis menggunakan AI EnhanceIt",
  category: "Maker",
  path: "/maker/enhanceimage?apikey=",
  async run(req, res) {
    const { apikey } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      // Jika pengguna upload file via form-data
      const file = req.file?.path || req.query.file;
      if (!file) {
        return res.json({ status: false, error: "File tidak ditemukan. Gunakan 'file' (upload) atau ?file=url" });
      }

      const form = new FormData();

      // Jika file adalah URL, unduh dulu
      let localFile = file;
      if (file.startsWith("http")) {
        const { data } = await axios.get(file, { responseType: "arraybuffer" });
        localFile = path.join(process.cwd(), "temp-enhance.jpg");
        fs.writeFileSync(localFile, data);
      }

      // Kirim file ke EnhanceIt
      form.append("file", fs.createReadStream(localFile));

      const response = await axios.post("https://enhanceit.pro/proxy-1.php", form, {
        headers: form.getHeaders(),
      });

      // Hapus file sementara jika diunduh
      if (file.startsWith("http")) fs.unlinkSync(localFile);

      if (!response.data?.output_url) {
        return res.json({ status: false, error: "Gagal memproses gambar." });
      }

      const outputUrl = response.data.output_url;
      res.json({
        status: true,
        message: "Gambar berhasil di-enhance!",
        result: outputUrl,
      });

    } catch (error) {
      console.error("Gagal Enhance:", error.message);
      res.status(500).json({ status: false, error: error.message });
    }
  },
};