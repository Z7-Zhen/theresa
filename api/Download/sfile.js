import axios from "axios";
import * as cheerio from "cheerio";

async function sfileScraper(url) {
  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    };

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const metadata = {
      title: $("title").text().trim(),
      description: $('meta[name="description"]').attr("content"),
      file_type: $(".file-content .list:contains('application/zip')")
        .text()
        .replace("-", "")
        .trim(),
      uploader: $('.list a[href*="user.php"]').text().trim(),
      uploader_profile: $('.list a[href*="user.php"]').attr("href"),
      category: $('.list a[href*="loads"]').text().trim(),
      category_link: $('.list a[href*="loads"]').attr("href"),
      upload_date: $(".list:contains('Uploaded:')")
        .text()
        .replace("Uploaded:", "")
        .trim(),
      download_count: $(".list:contains('Downloads:')")
        .text()
        .replace("Downloads:", "")
        .trim(),
      file_size:
        $(".list:contains('KB')")
          .first()
          .text()
          .match(/(\d+\.?\d*\s*(KB|MB|GB))/)?.[0] || "",
    };

    const downloadPageUrl = $("#download").attr("href");

    const downloadPageResponse = await axios.get(downloadPageUrl, { headers });
    const $$ = cheerio.load(downloadPageResponse.data);

    const scriptContent = $$("script")
      .filter((i, el) => $$(el).html().includes("download4325.sfile.mobi"))
      .html();

    let directDownloadUrl = "";

    if (scriptContent) {
      const urlMatch = scriptContent.match(/var sf = "([^"]+)"/);
      if (urlMatch && urlMatch[1]) {
        directDownloadUrl = urlMatch[1].replace(/\\/g, "");
      }
    }

    const buttonHref = $$("#download").attr("href");

    const downloadLinks = {
      direct_download: directDownloadUrl,
      button_download: buttonHref,
      safe_link: $$("#safe_link").attr("href"),
      download_page: downloadPageUrl,
    };

    return { metadata, download_links: downloadLinks };
  } catch (error) {
    throw new Error(error.message);
  }
}

export default {
  name: "Sfile",
  desc: "Scrape link file dan metadata dari sfile.mobi",
  category: "Downloader",
  path: "/download/sfile?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });
    if (!url) return res.json({ status: false, error: "Url is required" });

    try {
      const result = await sfileScraper(url);
      res.status(200).json({ status: true, result });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },
};