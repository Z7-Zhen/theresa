import * as cheerio from "cheerio";
import { basename, extname } from "path";
import mime from "mime-types";

/**
 * Scraper Mediafire
 * @param {string} url - URL Mediafire
 * @returns {Promise<Object>}
 */
async function mediafire(url) {
  const html = await (await fetch(url.trim())).text();
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content")?.trim() || "Unknown";
  const size =
    /Download\s*\(([\d.]+\s*[KMGT]?B)\)/i.exec($.html())?.[1] || "Unknown";
  const dl =
    $("a.popsok[href^='https://download']").attr("href")?.trim() ||
    $("a.popsok:not([href^='javascript'])").attr("href")?.trim() ||
    (() => {
      throw new Error("Download URL not found.");
    })();

  return {
    name: title,
    filename: basename(dl),
    type: extname(dl),
    size,
    download: dl,
    link: url.trim(),
  };
}

export default {
  name: "Mediafire",
  desc: "Download file dari Mediafire",
  category: "Downloader",
  path: "/download/mediafire?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!url)
      return res.json({ status: false, error: "Url is required" });

    try {
      const result = await mediafire(url);
      const mimetype = mime.lookup(result.filename) || "application/octet-stream";

      res.status(200).json({
        status: true,
        result: {
          ...result,
          mimetype,
        },
      });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  },
};