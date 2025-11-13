import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 📁 Scraper pencarian file dari MediaFireTrend
 * @param {string} query - Kata kunci pencarian
 * @returns {Promise<Object>}
 */
export async function mfsearch(query) {
  if (!query) throw new Error("Masukkan query pencarian, contoh: 'anime'");

  const baseUrl = "https://mediafiretrend.com";
  const proxy = "https://api.nekolabs.web.id/px?url=";

  try {
    // Ambil halaman pencarian via proxy
    const { data: html } = await axios.get(
      `${proxy}${encodeURIComponent(`${baseUrl}/?q=${encodeURIComponent(query)}&search=Search`)}`
    );

    const $ = cheerio.load(html.result.content);

    // Ambil semua link hasil pencarian
    let links = $("tbody tr a[href*='/f/']")
      .map((_, el) => $(el).attr("href"))
      .get();

    // Acak urutan hasil agar bervariasi
    links = links.sort(() => Math.random() - 0.5).slice(0, 5);

    const results = [];

    for (const link of links) {
      try {
        const { data } = await axios.get(
          `${proxy}${encodeURIComponent(`${baseUrl}${link}`)}`
        );
        const $ = cheerio.load(data.result.content);

        const raw = $(
          "div.info tbody tr:nth-child(4) td:nth-child(2) script"
        ).text();
        const match = raw.match(/unescape\(['"`]([^'"`]+)['"`]\)/);

        let decodedLink = null;
        if (match && match[1]) {
          const decoded = cheerio.load(decodeURIComponent(match[1]));
          decodedLink = decoded("a").attr("href") || null;
        }

        results.push({
          filename: $("tr:nth-child(2) td:nth-child(2) b").text().trim() || "Tidak diketahui",
          filesize: $("tr:nth-child(3) td:nth-child(2)").text().trim() || "Tidak diketahui",
          url: decodedLink,
          source_url: $("tr:nth-child(5) td:nth-child(2)").text().trim() || "-",
          source_title: $("tr:nth-child(6) td:nth-child(2)").text().trim() || "-",
        });
      } catch (err) {
        console.error("⚠️ Gagal parsing link:", link, err.message);
      }
    }

    return {
      status: true,
      creator: "Z7:林企业",
      query,
      total: results.length,
      results,
    };
  } catch (error) {
    console.error("❌ Gagal mengambil data:", error.message);
    return { status: false, message: error.message };
  }
}

// =============================
// 🔹 API Endpoint (Tanpa Apikey)
// =============================
export default {
  name: "MediaFire Search",
  desc: "Scraper pencarian file dari MediaFireTrend",
  category: "Search",
  path: "/search/MediaFire?query=",
  async run(req, res) {
    try {
      const { query } = req.query;
      if (!query)
        return res.status(400).json({
          status: false,
          message: "Masukkan parameter ?query= terlebih dahulu",
        });

      const result = await mfsearch(query);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        message: error.message || "Gagal mengambil data MediaFireTrend",
      });
    }
  },
};

// === Jalankan langsung dari terminal ===
if (process.argv[1].includes("mfsearch.js")) {
  const query = process.argv[2] || "anime";
  const result = await mfsearch(query);
  console.log(JSON.stringify(result, null, 2));
}
