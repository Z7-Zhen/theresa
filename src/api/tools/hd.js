const axios = require('axios');
const FormData = require('form-data');

module.exports = function(app) {
    async function enhanceImage(url) {
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
                throw new Error("Gagal memproses gambar.");
            }

            // Ambil hasil gambar enhance sebagai buffer
            const enhancedImage = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            return Buffer.from(enhancedImage.data);
        } catch (error) {
            throw error;
        }
    }

    app.get('/tools/hd', async (req, res) => {
        const { url } = req.query;

        if (!url) {
            return res.status(400).send("URL gambar wajib diisi");
        }

        try {
            const imageBuffer = await enhanceImage(url);
            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': imageBuffer.length,
            });
            res.end(imageBuffer);
        } catch (error) {
            console.error("Gagal Enhance:", error.message);
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};