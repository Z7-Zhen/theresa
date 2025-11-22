const axios = require("axios");
const cheerio = require("cheerio");

function getAbsoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return "https://komiku.id" + url;
}

function normalizeUrl(url) {
  return url.replace(/\/+$/, '');
}

async function getAllEpisodes(comicUrl) {
  const episodes = [];
  let pageNum = 1;
  let hasMorePages = true;
  comicUrl = normalizeUrl(comicUrl);

  while (hasMorePages) {
    try {
      const pageUrl = pageNum === 1 ? comicUrl : `${comicUrl}?page=${pageNum}`;
      const { data } = await axios.get(pageUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000
      });

      const $ = cheerio.load(data);
      let foundEpisodes = 0;

      const selectors = [
        "#Daftar_Chapter tbody tr",
        ".chapter-list tr",
        ".episode-list .episode",
        ".list-chapter .chapter"
      ];

      for (const selector of selectors) {
        if ($(selector).length > 0) {
          $(selector).each((i, el) => {
            if (i === 0 && $(el).find("th").length > 0) return;

            const chapterLinkElement = $(el).find("td.judulseries a, .chapter-title a, .episode-title a, a");
            const chapterTitle = chapterLinkElement.find("span").text().trim() || chapterLinkElement.text().trim();
            const relativeChapterLink = chapterLinkElement.attr("href");
            if (!chapterTitle || !relativeChapterLink) return;

            const chapterLink = getAbsoluteUrl(relativeChapterLink);
            const views = $(el).find("td.pembaca i, .views, .reader-count").text().trim() || "N/A";
            const date = $(el).find("td.tanggalseries, .date, .release-date").text().trim() || "N/A";

            if (!episodes.find(ep => ep.link === chapterLink)) {
              episodes.push({
                title: chapterTitle,
                link: chapterLink,
                views,
                release_date: date
              });
              foundEpisodes++;
            }
          });
          break;
        }
      }

      if (foundEpisodes === 0) hasMorePages = false;
      else pageNum++;
      if (episodes.length > 1000) hasMorePages = false;

    } catch (err) {
      hasMorePages = false;
    }
  }

  // Sort descending (terbaru di awal)
  return episodes.sort((a, b) => {
    const aNum = parseFloat(a.title.match(/\d+(\.\d+)?/)?.[0] || 0);
    const bNum = parseFloat(b.title.match(/\d+(\.\d+)?/)?.[0] || 0);
    return bNum - aNum;
  });
}

module.exports = function(app) {

  async function getComicDetailsWithEpisodes(comicUrl) {
    try {
      if (!comicUrl) throw new Error("Comic URL is required");

      const { data } = await axios.get(comicUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 15000
      });

      const $ = cheerio.load(data);
      const details = {};

      // Basic Titles
      details.title = $('h1 span[itemprop="name"]').text().trim() || "N/A";
      details.title_indonesian = $('p.j2').text().trim() || "N/A";
      details.short_description = ($('p[itemprop="description"]').text().trim().replace(/^Komik\s.*?\s-\s-\s/, '')) || "Tidak ada deskripsi singkat.";
      details.full_synopsis = ($('section#Sinopsis p').first().text().trim()) || "Tidak ada sinopsis lengkap.";

      // Meta Info
      const metaMap = {
        "Judul Komik": "original_title",
        "Judul Indonesia": "indonesian_title",
        "Jenis Komik": "type",
        "Konsep Cerita": "concept",
        "Pengarang": "author",
        "Status": "status",
        "Umur Pembaca": "age_rating",
        "Cara Baca": "read_direction"
      };
      details.metaInfo = {};
      $(".inftable tr").each((i, el) => {
        const label = $(el).find("td").first().text().trim();
        const value = $(el).find("td").eq(1).text().trim();
        if (metaMap[label]) details.metaInfo[metaMap[label]] = value;
      });

      // Genres
      details.genres = $('ul.genre li.genre a span[itemprop="genre"]').map((i, el) => $(el).text().trim()).get();

      // Thumbnail
      details.thumbnail_url = $('img[itemprop="image"]').attr("src") || "N/A";

      // Episodes
      details.episodes = await getAllEpisodes(comicUrl);

      return { success: true, url: comicUrl, details };

    } catch (err) {
      return { success: false, error: err.message || "Failed to get comic details" };
    }
  }

  // Route API
  app.get("/info/komiku", async (req, res) => {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({
        status: false,
        error: "URL komik wajib diisi"
      });
    }

    try {
      const data = await getComicDetailsWithEpisodes(url);
      const response = {
        status: data.success,
        creator: "Z7:林企业",
        url,
        details: data.details || undefined
      };
      if (!data.success) response.error = data.error;
      res.json(response);
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message
      });
    }
  });

};