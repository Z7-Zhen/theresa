const axios = require("axios");

module.exports = function(app) {
  // Endpoint GET /stalk/twitter?username=<username>
  app.get("/stalk/twitter", async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ error: true, message: "Query parameter 'username' is required" });

    try {
      // Ambil profile
      const { data: profileRes } = await axios.get(`https://www.twitter-viewer.com/api/x/user?username=${username}`);
      const profile = profileRes.data;

      // Ambil tweets
      const { data: tweetsRes } = await axios.get(`https://www.twitter-viewer.com/api/x/user-tweets?user=${profile.restId}&cursor=`);
      const tweets = tweetsRes.data.tweets;

      res.json({
        profile,
        tweets
      });
    } catch (err) {
      res.status(500).json({ error: true, message: err.message });
    }
  });
};