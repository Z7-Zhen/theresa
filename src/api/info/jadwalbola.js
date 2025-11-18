const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    async function jadwalSepakbola() {
        try {
            const res = await axios.get('https://www.jadwaltv.net/jadwal-sepakbola');
            const $ = cheerio.load(res.data);

            const result = [];

            $('table.table.table-bordered > tbody > tr.jklIv').each((_, el) => {
                const cleaned = $(el)
                    .html()
                    .replace(/<td>/g, '')
                    .replace(/<\/td>/g, ' - ')
                    .trim();

                const finalText = cleaned.substring(0, cleaned.length - 3);

                if (finalText) result.push(finalText);
            });

            if (!result.length) {
                return {
                    code: 404,
                    timestamp: Date.now(),
                    message: 'Tidak ada hasil ditemukan'
                };
            }

            return {
                code: 200,
                timestamp: Date.now(),
                data: result
            };
        } catch (e) {
            return {
                code: 500,
                timestamp: Date.now(),
                message: e.message
            };
        }
    }

    app.get('/info/jadwalbola', async (req, res) => {
        try {
            const data = await jadwalSepakbola();
            res.status(data.code).json(data);
        } catch (error) {
            res.status(500).json({
                code: 500,
                timestamp: Date.now(),
                message: error.message
            });
        }
    });
};