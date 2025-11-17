const axios = require('axios');

async function getSongDetails(query) {
  try {
    const response = await axios.get('https://spotdown.org/api/song-details', {
      params: { url: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Referer': 'https://spotdown.org/search',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Priority': 'u=0'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Gagal fetch detail lagu:', error.message);
    throw new Error('Gagal mengambil data lagu');
  }
}

module.exports = function(app) {
  app.get('/search/spotify', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ status: false, error: 'Parameter "q" wajib diisi' });

    try {
      const songData = await getSongDetails(query);

      res.status(200).json({
        status: true,
        result: songData
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};