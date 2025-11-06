import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "KuramanimeSearch",
  desc: "Cari anime di Kuramanime",
  category: "Search",
  path: "/search/kuramanime?apikey=&q=",

  async run(req, res) {
    const { apikey, q } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!q) {
      return res.json({ status: false, error: "Missing parameter: q" });
    }

    try {
      const url = `https://v8.kuramanime.tel/anime?order_by=ascending&search=${encodeURIComponent(q)}`;
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $(".product__item").each((_, el) => {
        const title = $(el).find(".product__item__text h5 a").text().trim();
        const link = $(el).find(".product__item__text h5 a").attr("href");
        const image = $(el).find(".product__item__pic").attr("data-setbg");

        if (title) {
          results.push({
            title,
            link: link.startsWith("http") ? link : `https://v8.kuramanime.tel${link}`,
            image: image?.startsWith("http") ? image : `https://v8.kuramanime.tel/${image}`,
          });
        }
      });

      if (!results.length) {
        return res.json({
          status: false,
          message: `Tidak ditemukan hasil untuk "${q}"`,
        });
      }

      return res.json({
        status: true,
        total: results.length,
        result: results,
      });
    } catch (err) {
      console.error("Kuramanime error:", err.message);
      return res.json({
        status: false,
        error: "Gagal mengambil data dari Kuramanime.",
      });
    }
  },
};
