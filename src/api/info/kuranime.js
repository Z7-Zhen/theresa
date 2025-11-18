const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Fetch anime detail from Kuramanime
 * @param {string} url
 * @returns {Promise<Object|null>}
 */
async function KuranimeDetail(url) {
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://v8.kuramanime.tel/",
      "Cache-Control": "no-cache",
    };

    // Optional proxy bypass
    const proxyUrl = `https://api.nekolabs.web.id/px?url=${encodeURIComponent(url)}`;
    const { data: byp } = await axios.get(proxyUrl);

    const { data: html } = await axios.get(url, {
      headers: byp?.result?.headers || headers,
    });

    const $ = cheerio.load(html);

    // === Episodes ===
    const episodes = [];
    const episodeContent = $("#episodeLists").attr("data-content");

    if (episodeContent) {
      const episodeDoc = cheerio.load(episodeContent);

      episodeDoc('a[href*="/episode/"]').each((index, element) => {
        const episodeUrl = episodeDoc(element).attr("href");
        const episodeText = episodeDoc(element).text().trim();
        const hasFlashIcon = episodeDoc(element).find(".fa-fire").length > 0;

        episodes.push({
          episode_number: index + 1,
          episode_text: episodeText,
          episode_url: episodeUrl,
          is_new: hasFlashIcon,
        });
      });
    }

    // === Anime Detail ===
    const animeData = {
      title: $(".anime__details__title h3").text().trim(),
      alternative_titles: $(".anime__details__title span").text().trim(),
      synopsis: $("#synopsisField").text().trim(),
      image: $(".anime__details__pic").attr("data-setbg"),
      rating: $(".ep .fa-star").parent().text().trim(),
      quality: $(".ep-v2").text().trim(),
      type: $('li:contains("Tipe:") a').text().trim(),
      total_episodes: $('li:contains("Episode:") a').text().trim(),
      status: $('li:contains("Status:") a').text().trim(),
      airing_period: $('li:contains("Tayang:")').text().replace("Tayang:", "").trim(),
      season: $('li:contains("Musim:") a').text().trim(),
      duration: $('li:contains("Durasi:") a').text().trim(),
      quality_detail: $('li:contains("Kualitas:") a').text().trim(),
      country: $('li:contains("Negara:") a').text().trim(),
      source: $('li:contains("Adaptasi:") a').text().trim(),
      genres: $('li:contains("Genre:") a').map((i, el) => $(el).text().trim()).get().join(", "),
      explicit: $('li:contains("Eksplisit:")').text().replace("Eksplisit:", "").trim(),
      demographic: $('li:contains("Demografis:") a').text().trim(),
      themes: $('li:contains("Tema:")').text().replace("Tema:", "").trim(),
      studio: $('li:contains("Studio:") a').text().trim(),
      score: $('li:contains("Skor:") a').text().trim(),
      fans: $('li:contains("Peminat:") a').text().trim(),
      age_rating: $('li:contains("Rating:") a').text().trim(),
      credit: $('li:contains("Kredit:") a').text().trim(),
      follow_button: $("#followButton").text().trim(),
      episodes: episodes,
    };

    return animeData;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return null;
  }
}

// === Export sebagai CommonJS module untuk Express ===
module.exports = function(app) {
  app.get("/info/kuranime", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: true, message: "Query parameter 'url' is required" });

    try {
      const result = await KuranimeDetail(url);
      if (!result) return res.status(500).json({ error: true, message: "Gagal mengambil data anime" });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: true, message: err.message });
    }
  });
};