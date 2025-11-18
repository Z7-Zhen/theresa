const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

module.exports = function(app) {
    async function identifyAnime(filePath) {
        const form = new FormData();
        form.append("image", fs.createReadStream(filePath));
        const res = await axios.post("https://www.animefinder.xyz/api/identify", form, {
            headers: { ...form.getHeaders() }
        });
        const d = res.data;
        return {
            anime: {
                title: d.animeTitle || null,
                synopsis: d.synopsis || null,
                genres: d.genres || [],
                studio: d.productionHouse || null,
                premiered: d.premiereDate || null
            },
            character: {
                name: d.character || null,
                description: d.description || null
            },
            references: Array.isArray(d.references)
                ? d.references.map(r => ({
                    site: r.site,
                    url: r.url
                }))
                : []
        };
    }

    async function downloadImage(url) {
        const tempFile = path.join(__dirname, "temp_download.jpg");
        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(tempFile, response.data);
        return tempFile;
    }

    // Endpoint GET akhir: /anime/identify?url=<link>
    app.get("/anime/identify", async (req, res) => {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).json({ error: true, message: "Query parameter 'url' is required" });
        }

        let filePath;
        try {
            // Download file dari URL
            filePath = await downloadImage(imageUrl);

            // Kirim file ke AnimeFinder API
            const result = await identifyAnime(filePath);

            // Hapus file sementara
            fs.unlinkSync(filePath);

            res.json(result);
        } catch (error) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.status(500).json({ error: true, message: error.message });
        }
    });
};