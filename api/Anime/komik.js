import axios from 'axios';
import * as cheerio from 'cheerio';

async function KomikIndoDetail(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const getInfo = (label) =>
      $(`span:contains("${label}")`).first().text().replace(`${label}:`, '').trim() || '-';

    const title = $('.entry-title').text().replace(/^Komik\s*/i, '').trim();
    const image = $('.thumb img').attr('src') || $('.wp-post-image').attr('src');
    const rating = $('span[itemprop="ratingValue"]').text().trim() || '-';
    const votes = $('span[itemprop="ratingCount"]').text().trim() || '-';
    const genres = $('.spe a[rel="tag"]').map((_, el) => $(el).text().trim()).get();
    const synopsis = $('.entry-content p').first().text().trim();

    return {
      title,
      image,
      rating,
      votes,
      alternativeTitle: getInfo('Judul Alternatif'),
      status: getInfo('Status'),
      author: getInfo('Pengarang'),
      illustrator: getInfo('Ilustrator'),
      graphics: getInfo('Grafis'),
      theme: getInfo('Tema'),
      comicType: getInfo('Jenis Komik'),
      genres,
      synopsis
    };
  } catch (error) {
    throw new Error("Gagal mengambil data komik: " + (error.message || error));
  }
}

export default {
  name: "Komik Indo Detail",
  desc: "Scrape detail komik dari KomikIndo via URL",
  category: "Anime",
  path: "/anime/komikindo/detail?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }
    if (!url) {
      return res.json({ status: false, error: "Parameter url wajib diisi" });
    }

    try {
      const data = await KomikIndoDetail(url);
      return res.json({ status: true, data });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message });
    }
  }
};