import axios from 'axios';

function checkMonetization(sub, view) {
  const subs = parseInt(sub || 0);
  const views = parseInt(view || 0);
  const watchHours = views * 0.1;
  return subs >= 1000 && watchHours >= 4000;
}

export default {
  name: "YouTube Channel Stats",
  desc: "Get statistics for a YouTube channel using your API key.",
  category: "Tools",
  path: "/tools/ytchannel/apikey=&url=",
  async run(req, res) {
    try {
      const { apikey, url } = req.query;

      // Validasi API Key
      if (!apikey) return res.status(401).json({ status: false, error: "API Key is required." });
      if (!Array.isArray(global.apikey) || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: "Invalid API Key." });
      }

      if (!url) return res.status(400).json({ status: false, error: "URL parameter is required." });

      // ===== Core Logic =====
      const { data: channelData } = await axios.post(
        'https://api.evano.com/api/youtube/search',
        { query: url, type: 'url' },
        { headers: {
            "Content-Type": "application/json",
            Origin: "https://evano.com",
            Referer: "https://evano.com",
            "User-Agent": "Mozilla/5.0"
        } }
      );

      if (!channelData || !channelData.channelId) {
        return res.status(404).json({ status: false, error: "Channel not found from the provided URL." });
      }

      const { data: analyticsData } = await axios.get(
        `https://api.evano.com/api/youtube/channel/${channelData.channelId}/analytics`,
        { headers: {
            Origin: "https://evano.com",
            Referer: "https://evano.com",
            "User-Agent": "Mozilla/5.0"
        } }
      );

      analyticsData['isMonetized'] = checkMonetization(
        analyticsData.channel.subscriberCount,
        analyticsData.channel.viewCount
      );

      res.json({
        status: true,
        message: "Successfully fetched channel statistics.",
        result: analyticsData
      });

    } catch (error) {
      console.error("YT Channel API Error:", error.response?.data || error.message);
      res.status(500).json({
        status: false,
        error: "An internal server error occurred."
      });
    }
  }
}
