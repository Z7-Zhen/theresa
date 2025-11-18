const axios = require("axios");
const FormData = require("form-data");

/**
 * 🔹 Cari video TikTok via TikWM API
 * @param {string} query - kata kunci pencarian
 * @param {number} retry - percobaan ulang jika gagal
 * @returns {Promise<Array>}
 */
async function ttSearch(query, retry = 0) {
  try {
    const d = new FormData();
    d.append("keywords", query);
    d.append("count", 15);
    d.append("cursor", 0);
    d.append("web", 1);
    d.append("hd", 1);

    const { data } = await axios.post("https://tikwm.com/api/feed/search", d, {
      headers: {
        ...d.getHeaders(),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://tikwm.com",
        "Referer": "https://tikwm.com/"
      },
      timeout: 10000, // 10 detik timeout
    });

    if (!data?.data?.videos?.length) return [];

    const baseURL = "https://tikwm.com";
    const videos = data.data.videos.map((video) => ({
      title: video.title || "No title",
      play: video.play ? baseURL + video.play : "",
      wmplay: video.wmplay ? baseURL + video.wmplay : "",
      music: video.music ? baseURL + video.music : "",
      cover: video.cover ? baseURL + video.cover : "",
      avatar: video.avatar ? baseURL + video.avatar : "",
      region: video.region || "Unknown",
      play_count: video.play_count || 0,
      digg_count: video.digg_count || 0,
    }));

    return videos;
  } catch (e) {
    // retry otomatis jika error 500
    if (e.response?.status === 500 && retry < 3) {
      console.warn(`❗ TikWM API error 500, retrying (${retry + 1})...`);
      return ttSearch(query, retry + 1);
    }
    console.error("❌ TikWM Search failed:", e.message);
    throw e;
  }
}

/**
 * 🔹 Route handler untuk /search/tiktok
 */
module.exports = function (app) {
  app.get("/search/tiktok", async (req, res) => {
    const { q } = req.query;

    if (!q) {
      return res.json({ status: false, error: "Query is required" });
    }

    try {
      const results = await ttSearch(q);

      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result: results,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        error: error.message || "Unknown error",
      });
    }
  });
};