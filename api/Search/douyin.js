// douyin-puppeteer.js
import puppeteer from "puppeteer";

export async function douyinSearch(query) {
  if (!query) throw new Error("Query required");

  const searchUrl = `https://so.douyin.com/s?douyin_web_id=7570740926563485190&keyword=${encodeURIComponent(query)}&enter_method=web_search`;

  const browser = await puppeteer.launch({
    headless: true, // set false kalau mau lihat browser
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  );

  await page.goto(searchUrl, { waitUntil: "networkidle2" });

  // Tunggu hasil video muncul
  await page.waitForSelector("div.video-feed-item, div.aweme-card", { timeout: 10000 }).catch(() => {});

  const results = await page.evaluate(() => {
    const videos = [];
    const items = document.querySelectorAll("div.video-feed-item, div.aweme-card");
    items.forEach((el) => {
      const title = el.querySelector("a")?.innerText || "";
      const url = el.querySelector("a")?.href || "";
      const cover = el.querySelector("img")?.src || "";
      const author = el.querySelector(".author-name")?.innerText || "";

      if (url) {
        videos.push({ title, author, video_url: url, cover });
      }
    });
    return videos;
  });

  await browser.close();

  return {
    creator: "Z7:林企业",
    status: true,
    result: results,
  };
}

// Contoh Express API route
export default {
  creator: "Z7:林企业",
  name: "Douyin Search Puppeteer",
  desc: "Search Douyin via web scraping (Puppeteer)",
  category: "Search",
  path: "/search/douyin?apikey=&q=",

  async run(req, res) {
    try {
      const { apikey, q } = req.query;
      if (!apikey || !global.apikey?.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!q) return res.json({ status: false, error: "Query is required" });

      const result = await douyinSearch(q);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
