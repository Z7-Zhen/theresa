const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function(app) {

  async function searchKuramanime(query) {
    const baseUrl = `https://v8.kuramanime.tel/anime?order_by=ascending&search=${encodeURIComponent(query)}`;

    try {
      const { data: byp } = await axios.get(`https://api.nekolabs.web.id/px?url=${baseUrl}`);
      const { data: html } = await axios.get(baseUrl, {
        headers: byp?.result?.headers || { "User-Agent": "Mozilla/5.0" }
      });

      // DEBUG: print sebagian HTML
      console.log("HTML RECEIVED:", html.substring(0, 500));

      const $ = cheerio.load(html);
      const animeList = [];

      $(".filter__gallery a").each((i, el) => {
        const link = $(el).attr("href");
        const title = $(el).find("h5.sidebar-title-h5").text().trim();
        const thumbnail = $(el).find(".product__sidebar__view__item").attr("data-setbg");

        if (title && thumbnail && link) {
          animeList.push({
            title,
            thumbnail,
            url: link
          });
        }
      });

      console.log("FOUND:", animeList.length, "results");

      return animeList;

    } catch (err) {
      console.error("SCRAPER ERROR:", err.message);
      return [];
    }
  }

  // ROUTE API
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
      return res.json({
        status: true,
        creator: "Z7:林企业",
        results
      });

    } catch (err) {
      return res.status(500).json({
        error: true,
        message: err.message
      });
    }
  });

};