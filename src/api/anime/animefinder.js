const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

module.exports = function (app) {

    async function downloadImage(url) {
        const tempFile = path.join(__dirname, "temp_animefinder.jpg");

        try {
            const res = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 15000
            });

            const contentType = res.headers["content-type"] || "";
            if (!contentType.includes("image/")) {
                throw new Error("URL bukan file gambar yang valid.");
            }

            fs.writeFileSync(tempFile, res.data);
            return tempFile;

        } catch (err) {
            throw new Error("Gagal mengunduh gambar: " + err.message);
        }
    }

    async function identifyAnime(filePath) {
        const form = new FormData();
        form.append("image", fs.createReadStream(filePath));

        try {
            const res = await axios.post(
                "https://www.animefinder.xyz/api/identify",
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 20000,

                    // ⚠️ PENTING
                    validateStatus: () => true // <- Axios TIDAK anggap status 500 sebagai error
                }
            );

            // Jika AnimeFinder balik 500 → tangani sendiri
            if (res.status >= 500) {
                return {
                    status: false,
                    reason: "AnimeFinder server error (500). Cobalah beberapa saat lagi."
                };
            }

            const d = res.data;

            // Data kosong atau invalid
            if (!d || typeof d !== "object") {
                return { status: false, reason: "AnimeFinder mengirim data tidak valid." };
            }

            // API error bawaan AnimeFinder
            if (d.error === true || d.success === false) {
                return {
                    status: false,
                    reason: d.message || "AnimeFinder gagal memproses gambar."
                };
            }

            // Normal success
            return {
                status: true,
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
                        site: r.site || null,
                        url: r.url || null
                    }))
                    : []
            };

        } catch (err) {
            // KALO ADA ERROR INTERNAL LAIN
            return {
                status: false,
                reason: "AnimeFinder tidak bisa diakses (" + err.message + ")"
            };
        }
    }

    // ROUTE
    app.get("/anime/identify", async (req, res) => {
        const imageUrl = req.query.url;

        if (!imageUrl) {
            return res.status(400).json({
                status: false,
                creator: "Z7:林企业",
                error: "Query 'url' wajib diisi"
            });
        }

        let filePath = null;

        try {
            filePath = await downloadImage(imageUrl);

            const result = await identifyAnime(filePath);

            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

            // Jika API gagal → tetap status 200 biar tidak error di client
            return res.json({
                status: result.status,
                creator: "Z7:林企业",
                error: result.status ? null : true,
                message: result.reason || null,
                result: result.status ? result : null
            });

        } catch (err) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

            return res.json({
                status: false,
                creator: "Z7:林企业",
                error: true,
                message: err.message
            });
        }
    });
};