const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

const agent = new https.Agent({ rejectUnauthorized: false });

async function fetchWebtoonsSearch(query) {
  try {
    if (!query) throw new Error("Masukkan kata kunci pencarian.");

    const encoded = encodeURIComponent(query);
    const url = `https://m.webtoons.com/id/search?keyword=${encoded}`;
    const { data } = await axios.get(url, { httpsAgent: agent });

    const $ = cheerio.load(data);
    const result = { original: [], canvas: [] };

    $(".webtoon_list_wrap")
      .first()
      .find(".webtoon_list li")
      .each((_, el) => {
        const $el = $(el);
        const title = $el.find(".info_text .title").text().trim();
        const author = $el.find(".info_text .author").text().trim();
        const viewCount = $el.find(".info_text .view_count").text().trim();
        const link = $el.find("a.link").attr("href");
        const image = $el.find(".image_wrap img").attr("src");
        const isNew = $el.find(".badge_new2").length > 0;

        if (title)
          result.original.push({ title, author, viewCount, link, image, isNew });
      });

    $(".webtoon_list_wrap")
      .last()
      .find(".webtoon_list.type_small li")
      .each((_, el) => {
        const $el = $(el);
        const title = $el.find(".info_text .title").text().trim();
        const author = $el.find(".info_text .author").text().trim();
        const viewCount = $el.find(".info_text .view_count").text().trim();
        const link = $el.find("a.link").attr("href");
        const image = $el.find(".image_wrap img").attr("src");

        if (title) result.canvas.push({ title, author, viewCount, link, image });
      });

    return result;
  } catch (err) {
    console.error("Error fetching Manwha Search:", err.message);
    throw new Error("Gagal mengambil data Webtoons Search. Periksa koneksi atau struktur HTML-nya.");
  }
}

module.exports = function(app) {
  app.get("/search/manwha", async (req, res) => {
    const q = req.query.q;
    if (!q)
      return res.status(400).json({
        status: false,
        error: "Parameter 'q' (keyword) wajib diisi. Contoh: /search/manwha?q=How to Fight"
      });

    try {
      const data = await fetchWebtoonsSearch(q);

      res.status(200).json({
        creator: "Z7:林企业",
        status: true,
        keyword: q,
        total_original: data.original.length,
        total_canvas: data.canvas.length,
        result: data
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};