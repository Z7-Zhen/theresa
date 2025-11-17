const axios = require("axios");
const FormData = require("form-data");

/**
 * 🔹 Cari video TikTok via TikWM API
 * @param {string} query - kata kunci pencarian
 * @returns {Promise<Array>}
 */
async function ttSearch(query) {
  try {
    const d = new FormData();
    d.append("keywords", query);
    d.append("count", 15);
    d.append("cursor", 0);
    d.append("web", 1);
    d.append("hd", 1);

    const { data } = await axios.post("https://tikwm.com/api/feed/search", d, {
      headers: { ...d.getHeaders() },
    });

    const baseURL = "https://tikwm.com";
    const videos = data.data.videos.map((video) => ({
      ...video,
      play: baseURL + video.play,
      wmplay: baseURL + video.wmplay,
      music: baseURL + video.music,
      cover: baseURL + video.cover,
      avatar: baseURL + video.avatar,
    }));

    return videos;
  } catch (e) {
    throw e;
  }
}

/**
 * 🔹 Route handler untuk /search/tiktok
 */
module.exports = function (app) {
  app.get("/search/tiktok", async (req, res) => {
    const { q } = req.query;

    // Validasi query
    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await ttSearch(q);
      res.status(200).json({
        status: true,
        result: results,
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};