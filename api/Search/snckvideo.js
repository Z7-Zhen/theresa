import axios from "axios";
import * as cheerio from "cheerio";

async function searchSnackVideo(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.snackvideo.com/discover/${encodedQuery}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
    });

    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]')
      .map((_, el) => $(el).html())
      .get();

    let videos = [];
    for (const script of scripts) {
      try {
        const data = JSON.parse(script);

        // Jika dalam bentuk daftar video
        if (Array.isArray(data.itemListElement)) {
          const filtered = data.itemListElement
            .filter((v) => v["@type"] === "VideoObject")
            .map((v) => ({
              judul_video: v.name,
              deskripsi: v.description,
              url_halaman: v.url,
              url_file_video: v.contentUrl,
              durasi: v.duration,
              diupload: v.uploadDate,
              commentCount: v.commentCount || 0,
            }));
          videos.push(...filtered);
        }

        // Jika hanya satu video
        else if (data["@type"] === "VideoObject") {
          videos.push({
            judul_video: data.name,
            deskripsi: data.description,
            url_halaman: data.url,
            url_file_video: data.contentUrl,
            durasi: data.duration,
            diupload: data.uploadDate,
            commentCount: data.commentCount || 0,
          });
        }
      } catch {
        // abaikan JSON yang tidak valid
      }
    }

    // Ambil maksimal 5 video agar respons ringan
    return videos.slice(0, 5);
  } catch (err) {
    return { error: err.message, videos: [] };
  }
}

export default {
  name: "SnackVideo Search",
  desc: "Cari video dari SnackVideo berdasarkan username atau keyword",
  category: "Search",
  path: "/seach/snackvideo?apikey=&query=",

  async run(req, res) {
    try {
      const { apikey, query } = req.query;

      // validasi apikey
      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!query) {
        return res.json({
          status: false,
          error: "Parameter 'query' wajib diisi",
        });
      }

      const videos = await searchSnackVideo(query);

      if (videos.error) {
        return res
          .status(500)
          .json({ status: false, error: videos.error, result: [] });
      }

      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        query,
        result_count: videos.length,
        result: videos,
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
