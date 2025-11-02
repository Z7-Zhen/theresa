import axios from "axios";
import * as cheerio from "cheerio";

async function igram(url) {
  try {
    if (!url) throw new Error("URL Instagram tidak boleh kosong");

    const encoded = encodeURIComponent(url);
    const res = await axios.get(
      "https://igram.website/content.php?url=" + encoded,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; Termux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
        },
      }
    );

    const json = res.data;
    if (!json.html) throw new Error("HTML kosong atau URL tidak valid");

    const $ = cheerio.load(json.html);
    const thumb = $("img.w-100").attr("src") || null;
    const caption = $("p.text-sm").text().trim() || null;
    const download = $('a:contains("Download HD")').attr("href") || null;
    const user = json.username || "unknown";

    if (!download) throw new Error("Gagal menemukan link unduhan");

    return {
      user,
      thumb,
      caption,
      download,
    };
  } catch (e) {
    return { error: true, message: e.message };
  }
}

export default [
  {
    name: "Instagram",
    desc: "Download video/foto dari Instagram via Igram",
    category: "Downloader",
    path: "/downloader/instagram?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;

        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({
            status: false,
            error: "Parameter 'url' wajib diisi",
          });

        const result = await igram(url);

        res.status(200).json({
          creator: "Z7:林企业",
          status: !result.error,
          result: result.error ? null : result,
          error: result.error ? result.message : null,
        });
      } catch (err) {
        res.status(500).json({
          creator: "Z7:林企业",
          status: false,
          error: err.message,
        });
      }
    },
  },
];