const axios = require("axios");
const cheerio = require("cheerio");

async function savetikScraper(url) {
  try {
    const response = await axios.post(
      "https://savetik.co/api/ajaxSearch",
      new URLSearchParams({ q: url, lang: "id", cftoken: "" }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
          accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
          Referer: "https://savetik.co/id/douyin-downloader",
        },
      }
    );

    if (!response.data || !response.data.data)
      throw new Error("No data returned from Savetik");

    const $ = cheerio.load(response.data.data);

    const title = $("h3").text().trim();
    const thumbnail = $("img").attr("src") || null;
    const hd = $('a:contains("Unduh MP4 HD")').attr("href") || null;
    const mp4 = $('a:contains("Unduh MP4")').attr("href") || null;
    const mp3 = $('a:contains("Unduh MP3")').attr("href") || null;

    const imageLinks = [];
    $(".photo-list .download-items__btn a").each((_, el) => {
      const img = $(el).attr("href");
      if (img) imageLinks.push(img);
    });

    return {
      type: imageLinks.length > 0 ? "image" : "video",
      title,
      thumbnail,
      hd: imageLinks.length > 0 ? null : hd,
      mp4: imageLinks.length > 0 ? null : mp4,
      mp3: imageLinks.length > 0 ? null : mp3,
      images: imageLinks.length > 0 ? imageLinks : null,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}

// --- Express route ---
module.exports = function (app) {
  app.get("/download/douyin", async (req, res) => {
    const { url } = req.query;

    if (!url)
      return res.status(400).json({ status: false, error: "Url is required" });

    try {
      const result = await savetikScraper(url);
      res.status(200).json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  });
};