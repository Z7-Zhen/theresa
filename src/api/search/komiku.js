const axios = require('axios');
const cheerio = require('cheerio');

function getAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return 'https://komiku.id' + url;
}

async function scrapeKomikuSearch(keyword) {
  if (!keyword) throw new Error('Keyword is required');

  const url = `https://api.komiku.id/?post_type=manga&s=${encodeURIComponent(keyword)}`;
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);
  const mangas = [];

  $('.bge').each((i, el) => {
    const bgei = $(el).find('.bgei > a');
    mangas.push({
      href: getAbsoluteUrl(bgei.attr('href')),
      thumbnail: bgei.find('img').attr('src'),
      type: bgei.find('b').text().trim(),
      genre: bgei.find('.tpe1_inf').text().trim().replace(bgei.find('b').text().trim(), '').trim(),
      title: $(el).find('.kan > a > h3').text().trim(),
      last_update: $(el).find('.kan > p').text().trim()
    });
  });

  return mangas;
}

module.exports = function(app) {
  app.get('/search/komiku', async (req, res) => {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ status: false, error: "Keyword wajib diisi" });
    }

    try {
      const mangas = await scrapeKomikuSearch(keyword);
      res.json({ 
        status: true, 
        creator: "Z7:林企业", 
        keyword, 
        total: mangas.length, 
        result: mangas 
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};