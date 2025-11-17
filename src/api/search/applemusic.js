const axios = require("axios");
const cheerio = require("cheerio");

const cookieString =
  "_ga=GA1.1.206983766.1756790346; PHPSESSID=jomn6brkleb5969a3opposidru; quality=m4a; dcount=2; _ga_382FSD5=GS2.1.s1756858170$o3$g1$t1756858172$j58$l0$h0";

const axiosInstance = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Cookie: cookieString,
  },
});

function parseSearch(html) {
  const $ = cheerio.load(html);
  const results = [];

  $(".top-search-lockup").each((_, el) => {
    const title = $(el).find(".top-search-lockup__primary__title").text().trim();
    const artist = $(el).find(".top-search-lockup__secondary").text().trim();
    const link = $(el).find(".click-action").attr("href");
    const image = $(el).find("picture source").attr("srcset")?.split(" ")[0];

    if (title && artist && link) {
      results.push({
        title,
        artist,
        link: link.startsWith("http") ? link : `https://music.apple.com${link}`,
        image: image || null,
      });
    }
  });

  return results;
}

async function applemusicSearch(query) {
  if (!query) throw new Error("Masukkan query pencarian lagu.");

  const region = "us";
  const url = `https://music.apple.com/${region}/search?term=${encodeURIComponent(query)}`;

  try {
    const { data } = await axiosInstance.get(url, { timeout: 30000 });
    return parseSearch(data);
  } catch (err) {
    console.error("Error Apple Music Search:", err.message);
    return [];
  }
}

module.exports = function (app) {
  app.get("/search/applemusic", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ status: false, error: "Parameter 'q' diperlukan" });

    try {
      const results = await applemusicSearch(query);
      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        query,
        total: results.length,
        results,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};