const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function(app) {
    async function searchKuramanime(query) {
        const baseUrl = `https://v8.kuramanime.tel/anime?order_by=ascending&search=${encodeURIComponent(query)}`;

        try {
            // Proxy bypass headers
            const { data: byp } = await axios.get(`https://api.nekolabs.web.id/px?url=${baseUrl}`);
            const { data: html } = await axios.get(baseUrl, { headers: byp.result.headers });

            const $ = cheerio.load(html);
            const animeList = [];

            $('.filter__gallery a').each((index, element) => {
                const link = $(element).attr('href');
                const title = $(element).find('h5.sidebar-title-h5').text().trim();
                const thumbnail = $(element).find('.product__sidebar__view__item').attr('data-setbg');

                if (title && thumbnail && link) {
                    animeList.push({ title, thumbnail, url: link });
                }
            });

            return animeList;

        } catch (error) {
            console.error("Error scraping:", error.message);
            return [];
        }
    }

    // Endpoint GET /anime/search?q=<query>
    app.get("/search/kuranime", async (req, res) => {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                error: true,
                message: "Query parameter 'q' is required"
            });
        }

        try {
            const results = await searchKuramanime(query);
            res.json(results);
        } catch (err) {
            res.status(500).json({
                error: true,
                message: err.message
            });
        }
    });
};