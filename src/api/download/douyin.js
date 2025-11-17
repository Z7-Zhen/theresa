const axios = require("axios");
const cheerio = require("cheerio");

async function douyinScraper(url) {
  try {
    const response = await axios.post(
      "https://lovetik.app/api/ajaxSearch",
      new URLSearchParams({ q: url, lang: "id" }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
          accept: "*/*",
        },
      }
    );

    if (!response.data || response.data.status !== "ok")
      throw new Error("No data found");

    const $ = cheerio.load(response.data.data);

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

    return {
      type: imageLinks.length > 0 ? "image" : "video",
      title,
      duration: duration || null,
      thumbnail,
      hd: imageLinks.length > 0 ? null : hd,
      mp3: imageLinks.length > 0 ? null : mp3,
      images: imageLinks.length > 0 ? imageLinks : null,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = function (app) {
  app.get("/download/douyin", async (req, res) => {
    const { url } = req.query;

    if (!url)
      return res.status(400).json({ status: false, error: "Url is required" });

    try {
      const result = await douyinScraper(url);
      res.status(200).json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });
};