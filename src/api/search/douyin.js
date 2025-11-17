const axios = require("axios");
const cheerio = require("cheerio");
const vm = require("vm");

module.exports = function (app) {
  /* === FUNGSIONALITAS DOUYIN SEARCH === */
  async function douyin(q) {
    try {
      if (!q) throw new Error("Query required");

      const baseURL = "https://so.douyin.com/";
      const defaultParams = {
        search_entrance: "aweme",
        enter_method: "normal_search",
        innerWidth: "431",
        innerHeight: "814",
        reloadNavStart: String(Date.now()),
        is_no_width_reload: "1",
        keyword: q,
      };

      const cookies = {};
      const api = axios.create({
        baseURL,
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "id-ID,id;q=0.9",
          referer: baseURL,
          "upgrade-insecure-requests": "1",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        },
      });

      api.interceptors.response.use((res) => {
        const setCookies = res.headers["set-cookie"];
        if (setCookies) {
          setCookies.forEach((c) => {
            const [name, value] = c.split(";")[0].split("=");
            if (name && value) cookies[name] = value;
          });
        }
        return res;
      });

      api.interceptors.request.use((config) => {
        if (Object.keys(cookies).length) {
          config.headers["Cookie"] = Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
        }
        return config;
      });

      await api.get("/");

      const res = await api.get("s", { params: defaultParams });
      const $ = cheerio.load(res.data);

      let scriptWithData = "";
      $("script").each((_, el) => {
        const text = $(el).html();
        if (text.includes("let data =") && text.includes('"business_data":')) {
          scriptWithData = text;
        }
      });

      const match = scriptWithData.match(/let\s+data\s*=\s*(\{[\s\S]+?\});/);
      if (!match) return [];

      const sandbox = {};
      vm.createContext(sandbox);
      vm.runInContext(`data = ${match[1]}`, sandbox);

      const awemeInfos = sandbox.data?.business_data
        ?.map((entry) => entry?.data?.aweme_info)
        .filter(Boolean);

      if (!awemeInfos) return [];

      // 🔹 Kembalikan semua hasil tanpa batasan
      return awemeInfos.map((v, i) => ({
        rank: i + 1,
        description: v.desc || "Tanpa deskripsi",
        author: v.author?.nickname || "Unknown",
        likes: v.statistics?.digg_count || 0,
        comments: v.statistics?.comment_count || 0,
        video_url: `https://www.douyin.com/video/${v.aweme_id}`,
        aweme_id: v.aweme_id,
      }));
    } catch (error) {
      console.error("Error fetching Douyin data:", error.message);
      return [];
    }
  }

  /* === ROUTE EXPRESS === */
  app.get("/search/douyin", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.json({ status: false, error: "Query is required" });

      const results = await douyin(q);
      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result: results,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        message: error.message || "Gagal mengambil hasil pencarian Douyin",
      });
    }
  });
};