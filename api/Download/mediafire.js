// file: mediafire.js
import axios from "axios";
import * as cheerio from "cheerio";
import { lookup } from "mime-types";

/**
 * 📥 Scraper MediaFire Downloader
 * @param {string} url - Link MediaFire
 * @returns {Promise<Object>}
 */
export async function mediafire(url) {
  if (!url || !url.includes("mediafire.com"))
    throw new Error("Masukkan URL MediaFire yang valid.");

  try {
    // Ambil halaman Mediafire via proxy bebas (hindari Cloudflare)
    const { data } = await axios.get(
      `https://api.nekolabs.web.id/px?url=${encodeURIComponent(url)}`
    );

    const html = data?.result?.content;
    if (!html) throw new Error("Gagal memuat halaman MediaFire.");

    const $ = cheerio.load(html);

    const filename =
      $(".dl-btn-label").attr("title") ||
      $("div.dl-info .filename").text().trim() ||
      $("title").text().replace("MediaFire", "").trim() ||
      "Unknown";

    const ext = filename.split(".").pop().toLowerCase();
    const mimetype = lookup(ext) || "application/octet-stream";

    const filesize =
      $(".dl-info ul.details li:nth-child(1) span").text().trim() || "Unknown";

    const uploaded =
      $(".dl-info ul.details li:nth-child(2) span").text().trim() || "Unknown";

    const download_url = $("#downloadButton").attr("href");

    if (!download_url) throw new Error("Gagal menemukan link unduhan.");

    return {
      status: true,
      creator: "Z7:林企业",
      result: {
        filename,
        filesize,
        mimetype,
        uploaded,
        download_url,
        source: url,
      },
    };
  } catch (err) {
    return {
      status: false,
      creator: "Z7:林企业",
      message: err.message || "Gagal mengambil data dari MediaFire.",
    };
  }
}

// =============================
// 🔹 Endpoint API tanpa API key
// =============================
export default {
  name: "Mediafire Downloader",
  desc: "Scraper untuk mengambil file dari tautan MediaFire.",
  category: "Downloader",
  path: "download/mediafire?url=",

  async run(req, res) {
    try {
      const { url } = req.query;
      if (!url)
        return res.status(400).json({
          status: false,
          message: "Masukkan parameter ?url= terlebih dahulu.",
        });

      const result = await mediafire(url);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        message: error.message || "Terjadi kesalahan internal server.",
      });
    }
  },
};

// =============================
// 🧪 Jalankan langsung di terminal
// =============================
if (import.meta.url === `file://${process.argv[1]}`) {
  const testURL =
    process.argv[2] ||
    "https://www.mediafire.com/file/xfk1u8yl4uqbizx/nulis.zip/file";
  const result = await mediafire(testURL);
  console.log(JSON.stringify(result, null, 2));
}
