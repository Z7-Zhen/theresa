const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

module.exports = function(app) {
    async function removeBackgroundFromUrl(imageUrl) {
        // Folder tmp di Vercel (writable)
        const tmpDir = "/tmp/removebg";
        fs.mkdirSync(tmpDir, { recursive: true });

        const tempFile = path.join(tmpDir, "temp_download.jpg");

        // Download image sementara
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(tempFile, response.data);

        // Prepare form-data
        const form = new FormData();
        form.append("image", fs.createReadStream(tempFile));
        form.append("format", "png");

        const res = await axios.post("https://api2.pixelcut.app/image/matte/v1", form, {
            headers: { ...form.getHeaders(), "x-client-version": "web" },
            responseType: "arraybuffer",
            timeout: 60000
        });

        // Hapus file sementara
        fs.unlinkSync(tempFile);

        return res.data; 
    }

    app.get("/tools/removebg", async (req, res) => {
        const imageUrl = req.query.url;
        if (!imageUrl) {
            return res.status(400).json({ error: true, message: "Query parameter 'url' is required" });
        }

        try {
            const pngBuffer = await removeBackgroundFromUrl(imageUrl);

            res.writeHead(200, {
                "Content-Type": "image/png",
                "Content-Length": pngBuffer.length
            });
            res.end(pngBuffer);
        } catch (error) {
            res.status(500).json({ error: true, message: error.message });
        }
    });
};