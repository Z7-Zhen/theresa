const axios = require("axios");
const FormData = require("form-data");

function fixUrl(url, base = "https://tikwm.com") {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return base + url;
}

module.exports = function(app) {

  async function tiktokCosplayScraper() {
    try {
      const keyword = "cosplay";
      let cursor = 0;
      let allVideos = [];
      let loop = true;

      while (loop) {
        const form = new FormData();
        form.append("keywords", keyword);
        form.append("count", "20"); // per page
        form.append("cursor", cursor.toString());
        form.append("web", "1");

        const { data } = await axios.post(
          "https://tikwm.com/api/photo/search",
          form,
          {
            headers: {
              ...form.getHeaders(),
              "User-Agent": "Mozilla/5.0",
              "Accept": "application/json",
              "Referer": "https://tikwm.com",
            }
          }
        );

        if (data.code !== 0 || !data.data) break;

        const videos = data.data.videos || [];
        allVideos.push(...videos);

        if (data.data.has_more === 1) {
          cursor = data.data.cursor; // next page
        } else {
          loop = false;
        }
      }

      const result = allVideos.map(v => ({
        id: v.video_id,
        title: v.title,
        time: v.create_time,

        author: {
          nickname: v.author?.nickname,
          username: v.author?.unique_id,
          avatar: fixUrl(v.author?.avatar),
        },

        cover: fixUrl(v.cover),
        play: fixUrl(v.play),

        images: (v.images || []).map(img => fixUrl(img)),

        stats: {
          views: v.play_count,
          likes: v.digg_count,
          comments: v.comment_count,
          shares: v.share_count,
        }
      }));

      return {
        success: true,
        total: result.length,
        keyword,
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
  app.get('/search/tiktok-photo', async (req, res) => {
    try {
      const data = await tiktokCosplayScraper();
      res.json({
        status: data.success,
        creator: "Z7:林企业",
        total: data.total || 0,
        keyword: data.keyword || "cosplay",
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