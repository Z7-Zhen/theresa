import axios from "axios";
import * as cheerio from "cheerio";

export default {
  name: "Douyin",
  desc: "Download video atau gambar dari Douyin/TikTok China",
  category: "Downloader",
  path: "/download/douyin?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });
    if (!url)
      return res.json({ status: false, error: "Url is required" });

    try {
      // Ambil data dari lovetik
      const response = await axios.post(
        "https://lovetik.app/api/ajaxSearch",
        new URLSearchParams({ q: url, lang: "id" }),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            accept: "*/*"
          }
        }
      );

      if (!response.data || response.data.status !== "ok")
        throw new Error("No data found");

      const $ = cheerio.load(response.data.data);

      // Scrape data
      const title = $("h3").text().trim();
      const thumbnail = $(".image-tik img").attr("src") || null;
      const duration = $("p").first().text().trim();

      const hd = $('a:contains("Unduh MP4 HD")').attr("href") || null;
      const mp3 = $('a:contains("Unduh MP3")').attr("href") || null;

      const imageLinks = [];
      $(".photo-list .download-items__btn a").each((_, el) => {
        const img = $(el).attr("href");
        if (img) imageLinks.push(img);
      });

      const result = {
        status: 200,
        type: imageLinks.length > 0 ? "image" : "video",
        title,
        duration: duration || null,
        thumbnail,
        hd: imageLinks.length > 0 ? null : hd,
        mp3: imageLinks.length > 0 ? null : mp3,
        images: imageLinks.length > 0 ? imageLinks : null
      };

      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  }
};