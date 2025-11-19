const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    async function wattpadSearch(query) {
        const url = `https://www.wattpad.com/search/${query}`;

        const res = await axios.get(url, {
            headers: {
                cookie: 'wp_id=d92aecaa-7822-4f56-b189-f8c4cc32825c;',
                'user-agent': 'Mozilla/5.0'
            }
        });

        const $ = cheerio.load(res.data);
        const base = "https://www.wattpad.com";
        const results = [];

        $('.story-card-container > ul.list-group.new-list-group > li.list-group-item').each(function () {

            const link = base + $(this).find('a').attr('href');
            const title = $(this).find('div.story-info > div.title').text().trim();
            const thumb = $(this).find('div.cover > img').attr('src');
            const desc = $(this).find('.description').text().replace(/\s+/g, ' ').trim();

            const stats = [];
            $(this).find('.new-story-stats > .stats-item').each((_, el) => {
                stats.push($(el).find('.sr-only').text());
            });

            results.push({
                title: title || null,
                reads: stats[0] || null,
                vote: stats[1] || null,
                chapter: stats[2] || null,
                desc: desc || null,
                thumb: thumb || null,
                link: link || null
            });
        });

        return results;
    }

    // API Route
    app.get('/search/wattpad', async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "Parameter 'q' wajib diisi!"
            });
        }

        try {
            const data = await wattpadSearch(q);

            res.json({
                status: true,
                creator: "Z7:林企业",
                result: data
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });

};