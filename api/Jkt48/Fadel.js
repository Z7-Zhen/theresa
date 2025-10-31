import axios from 'axios';

export default {
  name: "JKT48 Fadel",
  desc: "Kirim gambar random anggota JKT48 Fadel",
  category: "JKT48",
  path: "/jkt48/fadel?apikey=",
  async run(req, res) {
    try {
      const { apikey } = req.query;
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.status(401).send('Apikey invalid');
      }

      // Ambil list gambar Fadel dari JSON Adel
      const list = await axios.get(
        'https://raw.githubusercontent.com/Leoo7z/Image-Source/main/JKT48%2Fadel.json'
      ).then(r => r.data);

      if (!list || !list.length) {
        return res.status(500).send('Daftar gambar kosong');
      }

      // Pilih gambar random
      const imageUrl = list[Math.floor(Math.random() * list.length)];

      // Download gambar sebagai buffer
      const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' })
        .then(r => r.data);

      // Kirim sebagai binary
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length
      });
      res.end(Buffer.from(imageBuffer));

    } catch (error) {
      console.error(error);
      res.status(500).send('Gagal mengambil gambar: ' + error.message);
    }
  }
};