import axios from "axios";
import * as cheerio from "cheerio";

export async function alkitabSearch(q) {
  try {
    const response = await axios.get(
      `https://alkitab.me/search?q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 8.1.0; CPH1803; Build/OPM1.171019.026) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.4280.141 Mobile Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "id-ID",
          referer: "https://alkitab.me/",
          "upgrade-insecure-requests": "1",
        },
      }
    );

    const html = response.data;
    const $ = cheerio.load(html);
    const results = [];

    $("div.vw").each((index, element) => {
      const title = $(element).find("a").text().trim();
      const link = $(element).find("a").attr("href");
      const text = $(element).find("p").text().trim();

      if (title && text) {
        results.push({
          title,
          text,
          link: link?.startsWith("http")
            ? link
            : `https://alkitab.me${link || ""}`,
        });
      }
    });

    return results;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return [];
  }
}

export default {
  name: "Alkitab Search",
  desc: "Cari ayat Alkitab berdasarkan kata kunci",
  category: "Search",
  path: "/search/alkitab?apikey=&q=",
  async run(req, res) {
    try {
      const { apikey, q } = req.query;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!q) {
        return res.json({ status: false, error: "Query is required" });
      }

      const results = await alkitabSearch(q);

      if (results.length === 0) {
        return res.json({
          status: true,
          message: `Pencarian "${q}" tidak ditemukan dalam Alkitab.`,
          result: [],
        });
      }

      res.status(200).json({
        status: true,
        result: results,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },
};
