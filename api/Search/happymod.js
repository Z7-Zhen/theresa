import axios from "axios";
import * as cheerio from "cheerio";

export async function happymod(query) {
  if (!query) throw new Error("Query required");

  const url = `https://id.happymod.cloud/search.html?q=${encodeURIComponent(query)}`;
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      referer: "https://id.happymod.cloud/",
    },
  });

  const $ = cheerio.load(data);
  const results = [];

  $("li.list-item").each((i, el) => {
    const name = $(el).find(".list-info-title").text().trim();
    const icon = $(el).find(".list-icon img").attr("data-src");
    const link = $(el).find("a.list-box").attr("href");
    const version = $(el).find(".list-info-text span").first().text().trim();
    const size = $(el).find(".list-info-text span").eq(2).text().trim();
    const extra = $(el).find(".list-info-text span").eq(3).text().trim();

    if (name && link) {
      results.push({
        rank: i + 1,
        name,
        icon,
        link: link.startsWith("http") ? link : `https://id.happymod.cloud${link}`,
        version,
        size,
        extra: extra || null,
      });
    }
  });

  return results.slice(0, 10); // maksimal 10 hasil
}

export default {
  name: "HappyMod Search",
  desc: "Search HappyMod APKs (name, icon, link, version, size, extra info)",
  category: "Search",
  path: "/search/happymod?apikey=&q=",
  async run(req, res) {
    try {
      const { apikey, q } = req.query;

      if (!apikey || !global.apikey?.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      if (!q)
        return res.json({ status: false, error: "Query is required" });

      const results = await happymod(q);
      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result: results,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        message: error.message || "Gagal mengambil hasil pencarian HappyMod",
      });
    }
  },
};
