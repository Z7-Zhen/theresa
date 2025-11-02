import axios from "axios";

async function identifyAnime(url) {
  try {
    const res = await axios.post(
      "https://www.animefinder.xyz/api/identify",
      { image: url },
      { headers: { "Content-Type": "application/json" } }
    );

    const d = res.data;
    const result = {
      anime: {
        title: d.animeTitle || null,
        synopsis: d.synopsis || null,
        genres: d.genres || [],
        studio: d.productionHouse || null,
        premiered: d.premiereDate || null,
      },
      character: {
        name: d.character || null,
        description: d.description || null,
      },
      references: Array.isArray(d.references)
        ? d.references.map((r) => ({
            site: r.site,
            url: r.url,
          }))
        : [],
    };
    return result;
  } catch (err) {
    return { error: true, message: err.message };
  }
}

export default [
  {
    name: "Anime Finder", // 🔹 Name tetap Anime Finder
    desc: "Identifikasi anime dari URL gambar",
    category: "Anime",      // 🔹 Kategori diubah
    path: "/anime/anifinder?apikey=&url=", // 🔹 Path diubah
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url) return res.json({ status: false, error: "URL is required" });

        const result = await identifyAnime(url);

        res.status(200).json({
          status: !result.error,
          result: result.error ? null : result,
          error: result.error ? result.message : null,
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
];