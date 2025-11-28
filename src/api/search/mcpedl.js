const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Validate URL format
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

module.exports = function (app) {

    async function mcpedlSearch(query) {
        if (!query?.trim()) {
            return { success: false, error: "Query is required" };
        }

        try {
            const res = await axios.get(`https://mcpedl.org/?s=${encodeURIComponent(query)}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 9; Redmi 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36"
                }
            });

            const html = res.data;
            const $ = cheerio.load(html);

            const blocks = $(".g-block.size-20");
            if (blocks.length === 0) {
                return { success: false, error: "Mod tidak ditemukan" };
            }

            const results = [];

            blocks.each((i, el) => {
                const title = $(el).find(".entry-title a").text().trim();
                const url = $(el).find(".entry-title a").attr("href");

                let thumbnailUrl =
                    $(el).find(".post-thumbnail img").attr("data-src") ||
                    $(el).find(".post-thumbnail img").attr("src");

                if (!title || !isValidUrl(url)) return;

                if (!thumbnailUrl || !isValidUrl(thumbnailUrl)) {
                    thumbnailUrl = null;
                }

                // Ambil rating
                const ratingWidth = $(el)
                    .find(".rating-wrapper .rating-box .rating-subbox")
                    .attr("style");

                const rating = ratingWidth
                    ? (parseInt(ratingWidth.split(":")[1]) / 100) * 5
                    : 0;

                results.push({
                    title,
                    url,
                    thumbnailUrl,
                    rating: Number(rating.toFixed(1)),
                });
            });

            if (results.length === 0) {
                return { success: false, error: "Tidak ada hasil yang valid." };
            }

            return { success: true, data: results };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // 🔥 ROUTE EXPRESS
    app.get("/search/mcpedl", async (req, res) => {
        const { query } = req.query;
        if (!query) return res.status(400).json({ success: false, error: "Parameter ?query= wajib" });

        try {
            const data = await mcpedlSearch(query);
            res.json(data);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

};