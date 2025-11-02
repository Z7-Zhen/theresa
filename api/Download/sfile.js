import * as cheerio from "cheerio";
import axios from "axios";

const sfile = {
  createHeaders(referer) {
    return {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Not/A)Brand";v="8", "Chromium";v="137", "Google Chrome";v="137"',
      dnt: "1",
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      Referer: referer,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };
  },

  extractCookies(responseHeaders) {
    return (
      responseHeaders["set-cookie"]
        ?.map((cookie) => cookie.split(";")[0])
        .join("; ") || ""
    );
  },

  extractMetadata($) {
    const metadata = {};
    $(".file-content")
      .eq(0)
      .each((_, element) => {
        const $element = $(element);
        metadata.file_name = $element.find("img").attr("alt");
        metadata.mimetype = $element
          .find(".list")
          .eq(0)
          .text()
          .trim()
          .split("-")[1]
          ?.trim();
        metadata.author_name = $element
          .find(".list")
          .eq(1)
          .find("a")
          .text()
          .trim();
        metadata.upload_date = $element
          .find(".list")
          .eq(2)
          .text()
          .trim()
          .split(":")[1]
          ?.trim();
        metadata.download_count = $element
          .find(".list")
          .eq(3)
          .text()
          .trim()
          .split(":")[1]
          ?.trim();
      });
    return metadata;
  },

  async makeRequest(url, options) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (error.response) return error.response;
      throw new Error(`Request gagal: ${error.message}`);
    }
  },

  async download(url, resultBuffer = false) {
    try {
      let headers = this.createHeaders(url);
      const initialResponse = await this.makeRequest(url, { headers });

      const cookies = this.extractCookies(initialResponse.headers);
      headers["Cookie"] = cookies;

      let $ = cheerio.load(initialResponse.data);
      const metadata = this.extractMetadata($);

      const downloadUrl = $("#download").attr("href");
      if (!downloadUrl) throw new Error("Download URL tidak ditemukan");

      headers["Referer"] = downloadUrl;
      const processResponse = await this.makeRequest(downloadUrl, { headers });

      const html = processResponse.data;
      $ = cheerio.load(html);
      const scripts = $("script")
        .map((i, el) => $(el).html())
        .get()
        .join("\n");

      const finalUrlRegex =
        /https:\\\/\\\/download\d+\.sfile\.mobi\\\/downloadfile\\\/\d+\\\/\d+\\\/[a-z0-9]+\\\/[^\s'"]+\.[a-z0-9]+(\?[^"']+)?/gi;
      const matches = scripts.match(finalUrlRegex);

      if (!matches || !matches.length)
        throw new Error("Link download final tidak ditemukan");

      const finalUrl = matches[0].replace(/\\\//g, "/");

      let download;
      if (resultBuffer) {
        const fileResponse = await this.makeRequest(finalUrl, {
          headers,
          responseType: "arraybuffer",
        });
        download = Buffer.from(fileResponse.data);
      } else {
        download = finalUrl;
      }

      return { metadata, download };
    } catch (error) {
      throw new Error(`Sfile gagal: ${error.message}`);
    }
  },
};

export default [
  {
    name: "Sfile",
    desc: "Download file dari sfile.mobi dan ambil metadata file.",
    category: "Downloader",
    path: "/download/sfile?apikey=&url=",

    async run(req, res) {
      try {
        const { apikey, url } = req.query;

        // 🔒 Validasi apikey
        if (!apikey || !global.apikey?.includes(apikey)) {
          return res.json({
            status: false,
            creator: "Z7:林企业",
            error: "Apikey invalid",
          });
        }

        // 🔗 Validasi URL
        if (!url)
          return res.json({
            status: false,
            creator: "Z7:林企业",
            error: "URL is required",
          });

        // 🚀 Jalankan scraper utama
        const result = await sfile.download(url, false);

        res.status(200).json({
          status: true,
          creator: "Z7:林企业",
          result: {
            file_name: result.metadata.file_name,
            mimetype: result.metadata.mimetype,
            author_name: result.metadata.author_name,
            upload_date: result.metadata.upload_date,
            download_count: result.metadata.download_count,
            download_url: result.download,
          },
        });
      } catch (error) {
        res.status(500).json({
          status: false,
          creator: "Z7:林企业",
          error: error.message,
        });
      }
    },
  },
];