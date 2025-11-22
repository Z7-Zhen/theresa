const axios = require("axios");

function fixUrl(url, base = "https://tikwm.com") {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return base + url;
}

module.exports = function(app) {

  async function tiktokUserScraper(username = "z7nemophila") {
    try {
      const { data } = await axios.get(
        `https://tikwm.com/api/user/posts?unique_id=${username}&count=50`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://tikwm.com",
          }
        }
      );

      if (data.code !== 0 || !data.data) {
        throw new Error(data.msg || "API Error");
      }

      const items = data.data?.videos || [];

      const result = items.map(v => ({
        id: v.video_id,
        desc: v.title,
        create_time: v.create_time,
        type: v.image_post ? "photo" : "video",
        author: {
          nickname: v.author?.nickname,
          username: v.author?.unique_id,
          avatar: fixUrl(v.author?.avatar),
        },
        cover: fixUrl(v.cover),
        play: fixUrl(v.play),
        images: v.image_post ? (v.images || []).map(img => fixUrl(img)) : [],
        stats: {
          views: v.play_count,
          likes: v.digg_count,
          comments: v.comment_count,
          shares: v.share_count,
        }
      }));

      return {
        success: true,
        username,
        total: result.length,
        result,
      };

    } catch (e) {
      return {
        success: false,
        error: e.message,
      };
    }
  }

  // Route API
  app.get('/search/tiktok-user', async (req, res) => {
    const { username } = req.query; // bisa kirim username custom
    if (!username) {
      return res.status(400).json({
        status: false,
        error: "Username wajib diisi"
      });
    }

    try {
      const data = await tiktokUserScraper(username);
      res.json({
        status: data.success,
        creator: "Z7:林企业",
        username: data.username,
        total: data.total || 0,
        result: data.result || [],
        error: data.error || null
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};