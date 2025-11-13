import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 🎵 Scraper pencarian lagu dari SoundCloud
 * @param {string} query - Kata kunci pencarian
 */
export async function scsrc(query) {
  if (!query) throw new Error("Masukkan query pencarian, contoh: 'Nawasena'");

  const url = `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13; SoundCloudBot/1.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        Referer: "https://soundcloud.com/",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(data);
    const results = [];

    $("ul.List_VerticalList__2uQYU > li").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a.Cell_CellLink__3yLVS").attr("href");
      if (!link) return;

      const title = $el.find(".Information_CellTitle__2KitR").text().trim();
      const artist = $el.find(".Information_CellSubtitle__1mXGx").text().trim();
      const thumb =
        $el.find("img.Artwork_ArtworkImage__1Ws9-").attr("src") ?? "";
      const thumbnail_high = thumb.replace("-t240x240.jpg", "-t500x500.jpg");
      const url = `https://soundcloud.com${link}`;

      if (title && artist && url) {
        results.push({
          title,
          artist,
          thumbnail: thumbnail_high,
          url,
        });
      }
    });

    return {
      status: true,
      creator: "Z7:林企业",
      query,
      total: results.length,
      results,
    };
  } catch (err) {
    console.error("❌ Gagal mengambil data SoundCloud:", err.message);
    return { status: false, message: err.message };
  }
}

// =============================
// 🔹 API Endpoint (Tanpa Apikey)
// =============================
export default {
  name: "SoundCloud Search",
  desc: "Scraper pencarian lagu dari SoundCloud mobile site",
  category: "Search",
  path: "/search/soundcloud?query=",
  async run(req, res) {
    try {
      const { query } = req.query;

      if (!query)
        return res.status(400).json({
          status: false,
          message: "Masukkan parameter ?query= terlebih dahulu",
        });

      const result = await scsrc(query);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        message: error.message || "Gagal mengambil data SoundCloud",
      });
    }
  },
};

// === Jalankan langsung dari terminal ===
if (process.argv[1].includes("soundcloud.js")) {
  const query = process.argv[2] || "Nawasena";
  const result = await scsrc(query);
  console.log(JSON.stringify(result, null, 2));
}
