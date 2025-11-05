import axios from "axios";

async function ytmp4(url) {
  try {
    const res = await axios.get("https://www.a2zconverter.com/api/files/new-proxy", {
      params: { url },
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.a2zconverter.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });

    // Ambil link MP4
    const mp4 = res.data?.formats?.find(f => f.type === "mp4" && f.url)?.url || null;
    if (!mp4) throw new Error("MP4 link tidak ditemukan");

    return {
      title: res.data?.title || "Unknown",
      thumbnail: res.data?.thumbnail || null,
      mp4
    };
  } catch (err) {
    throw new Error("Gagal memproses URL: " + err.message);
  }
}

export default {
  name: "YTMP4 Downloader",
  desc: "Download video YouTube/Shorts ke MP4",
  category: "Downloader",
  path: "/downloader/ytmp4?apikey=&url=",
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({ status: false, error: "Parameter url wajib diisi" });
    }

    try {
      const data = await ytmp4(url);
      return res.json({ status: true, url, result: data });
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
  },
};
