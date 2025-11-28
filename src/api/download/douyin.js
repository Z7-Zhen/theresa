const axios = require("axios");
const cheerio = require("cheerio");

/* util aman */
const safe = (x) => (x ? x : null);

async function douyinScraper(url) {
  try {
    const response = await axios.post(
      "https://lovetik.app/api/ajaxSearch",
      new URLSearchParams({ q: url, lang: "id" }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          accept: "*/*",
        },
      }
    );

    const data = response.data;

    if (!data) throw new Error("Lovetik kosong");
    if (data.status !== "ok") throw new Error("Lovetik gagal memproses URL");

    const raw = data.data;

    /* ===================================================================
       1) PARSER BARU - JSON API
       =================================================================== */
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      let title = raw.desc || raw.title || raw.caption || null;
      let thumbnail = raw.cover || raw.thumb || raw.thumbnail || null;

      let hd = null;
      let mp3 = null;
      const images = [];

      const links = raw.links || raw.medias || raw.video || raw.data || [];

      if (Array.isArray(links)) {
        for (const x of links) {
          if (!x) continue;

          const type = (x.a || x.type || "").toLowerCase();

          if (type.includes("hd") || x.quality === "hd")
            hd = x.dlink || x.url;

          if (x.s === "mp3" || type.includes("mp3"))
            mp3 = x.dlink || x.url;

          if (x.s === "jpg" || x.s === "png" || type.includes("image"))
            images.push(x.dlink || x.url);
        }
      }

      return {
        parser: "json-api",
        type: images.length ? "image" : "video",
        title,
        thumbnail,
        hd: images.length ? null : safe(hd),
        mp3: images.length ? null : safe(mp3),
        images: images.length ? images : null,
      };
    }

    /* ===================================================================
       2) PARSER LAMA - HTML
       =================================================================== */
    if (typeof raw === "string") {
      const $ = cheerio.load(raw);

      const title = $("h3").text().trim() || null;
      const thumbnail = $(".image-tik img").attr("src") || null;

      const links = [];
      $("a").each((i, el) => {
        const href = $(el).attr("href");
        const txt = $(el).text().toLowerCase();

        if (!href) return;

        links.push({ href, txt });
      });

      let hd = null,
        mp3 = null,
        mp4_1 = null,
        mp4_2 = null;

      for (const x of links) {
        if (x.txt.includes("mp4") && !mp4_1) mp4_1 = x.href;
        else if (x.txt.includes("mp4") && !mp4_2) mp4_2 = x.href;

        if (x.txt.includes("hd")) hd = x.href;
        if (x.txt.includes("mp3")) mp3 = x.href;
      }

      return {
        parser: "html",
        type: "video",
        title,
        thumbnail,
        hd: safe(hd),
        mp3: safe(mp3),
        mp4_1,
        mp4_2,
      };
    }

    /* ===================================================================
       3) FORMAT ANEH (fallback)
       =================================================================== */
    return {
      parser: "unknown",
      raw,
      error: "FORMAT LOVETIK TIDAK DIKENAL — perlu update parser",
    };

  } catch (err) {
    throw new Error(`Douyin scrape error: ${err.message}`);
  }
}

module.exports = function (app) {
  app.get("/download/douyin", async (req, res) => {
    const { url } = req.query;

    if (!url)
      return res.status(400).json({
        status: false,
        error: "Url is required",
      });

    try {
      const result = await douyinScraper(url);
      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result,
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        error: e.message,
      });
    }
  });
};