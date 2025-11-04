import axios from "axios";
import https from "https";
import * as cheerio from "cheerio";

const agent = new https.Agent({ rejectUnauthorized: false }); // Bypass SSL di Termux / VPS

async function fetchWebtoons() {
  try {
    const { data } = await axios.get("https://www.webtoons.com/id/", {
      httpsAgent: agent,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
        "Accept-Language": "id,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);

    const result = {
      trending: [],
      popular: [],
    };

    // --- Trending Section ---
    $("li._trending_title_a, a._trending_title_a").each((_, el) => {
      const $el = $(el);
      const rank = parseInt($el.attr("data-rank")) || result.trending.length + 1;
      const title = $el.find(".subj, .title").text().trim();
      const title_no = parseInt($el.attr("data-title-no")) || null;
      const genre = $el.find(".genre").text().trim() || "Unknown";
      const url = $el.attr("href") || "";
      const thumbnail = $el.find("img").attr("src") || "";

      if (title)
        result.trending.push({ rank, title, title_no, genre, url, thumbnail });
    });

    // --- Popular Section ---
    $("li._popular_title_a, a._popular_title_a").each((_, el) => {
      const $el = $(el);
      const rank = parseInt($el.attr("data-rank")) || result.popular.length + 1;
      const title = $el.find(".subj, .title").text().trim();
      const title_no = parseInt($el.attr("data-title-no")) || null;
      const genre = $el.find(".genre").text().trim() || "Unknown";
      const url = $el.attr("href") || "";
      const thumbnail = $el.find("img").attr("src") || "";

      if (title)
        result.popular.push({ rank, title, title_no, genre, url, thumbnail });
    });

    // Sort by rank ascending
    result.trending.sort((a, b) => a.rank - b.rank);
    result.popular.sort((a, b) => a.rank - b.rank);

    return result;
  } catch (err) {
    console.error("Error fetching Webtoons:", err.message);
    throw new Error("Gagal mengambil data Webtoons (SSL/struktur HTML).");
  }
}

export default {
  name: "Manwha",
  desc: "Get trending & popular Webtoons / Manhwa list (Indonesia)",
  category: "Anime",
  path: "/anime/manwha?apikey=",
  async run(req, res) {
    try {
      const { apikey } = req.query;
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res
          .status(403)
          .json({ status: false, error: "Apikey invalid" });
      }

      const data = await fetchWebtoons();
      res.status(200).json({
        creator: "Z7:林企业",
        status: true,
        result: data,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },
};