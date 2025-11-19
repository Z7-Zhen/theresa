const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {

    async function spotifydl(url) {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid url.');

        // Ambil halaman utama SpotDL.io untuk CSRF token & cookie
        const rynn = await axios.get('https://spotdl.io/', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(rynn.data);

        // Setup axios instance
        const api = axios.create({
            baseURL: 'https://spotdl.io',
            headers: {
                cookie: rynn.headers['set-cookie'].join('; '),
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-csrf-token': $('meta[name="csrf-token"]').attr('content')
            }
        });

        const [{ data: meta }, { data: dl }] = await Promise.all([
            api.post('/getTrackData', { spotify_url: url }),
            api.post('/convert', { urls: url })
        ]);

        // Format JSON agar lebih rapi
        return {
            id: meta.id,
            name: meta.name,
            artist: meta.artists?.map(a => a.name).join(', ') || '',
            album_cover: meta.album?.images?.[0]?.url || '',
            explicit: meta.explicit || false,
            duration_ms: meta.duration_ms || 0,
            duration: `${Math.floor(meta.duration_ms / 60000)}:${String(Math.floor((meta.duration_ms % 60000)/1000)).padStart(2,'0')}`,
            spotify_url: meta.external_urls?.spotify || url,
            download_url: dl.url
        };
    }

    // Route API GET
    app.get('/download/spotify', async (req, res) => {
        const { url } = req.query;

        if (!url) return res.status(400).json({
            status: false,
            error: "Parameter URL wajib diisi"
        });

        try {
            const result = await spotifydl(url);
            res.json({
                status: true,
                creator: "Z7:林企业",
                result
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "Z7:林企业",
                error: error.message
            });
        }
    });
};