const axios = require("axios");
const cheerio = require("cheerio");

/**
 * 🔹 Scraper pencarian lagu SoundCloud
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function scSearch(query) {
  if (!query) throw new Error("Masukkan query pencarian!");

  const url = `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; SoundCloudBot/1.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        Referer: "https://soundcloud.com/",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $("ul.List_VerticalList__2uQYU > li").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a.Cell_CellLink__3yLVS").attr("href");
      if (!link) return;

      const title = $el.find(".Information_CellTitle__2KitR").text().trim();
      const artist = $el.find(".Information_CellSubtitle__1mXGx").text().trim();

      const thumb =
        $el.find("img.Artwork_ArtworkImage__1Ws9-").attr("src") ?? "";
      const thumbnail_high = thumb.replace("-t240x240.jpg", "-t500x500.jpg");

      const trackURL = `https://soundcloud.com${link}`;

      if (title && artist && trackURL) {
        results.push({
          title,
          artist,
          thumbnail: thumbnail_high,
          url: trackURL,
        });
      }
    });

    return results;
  } catch (e) {
    throw e;
  }
}

/**
 * 🔹 Route handler untuk /search/soundcloud
 */
module.exports = function (app) {
  app.get("/search/soundcloud", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await scSearch(q);
      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result: results,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  });
};