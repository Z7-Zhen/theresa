import axios from "axios";

/* 🔹 Fungsi utama Threads Downloader */
async function fetchThreads(url) {
  const api = "https://snapthreads.net/api/download";
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
    Referer: "https://snapthreads.net/id",
  };

  const { data } = await axios.get(api, {
    params: { url, slof: 1 },
    headers,
    decompress: true,
  });

  if (!data || !data.data) throw new Error("Gagal mengambil data Threads.");

  return data.data.map((item) => ({
    type: item.type || "unknown",
    url: item.url || "",
    thumbnail: item.thumbnail || null,
  }));
}

/* 🔹 Export fitur API */
export default [
  {
    name: "Threads",
    desc: "Unduh media dari Threads (gambar/video) menggunakan API SnapThreads",
    category: "Downloader",
    path: "/download/threads?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });

        if (!url)
          return res.json({ status: false, error: "Parameter url wajib diisi" });

        const result = await fetchThreads(url);

        res.status(200).json({
          creator: "Z7:林企业",
          status: true,
          result,
        });
      } catch (err) {
        console.error("❌ Threads Error:", err.message);
        res.status(500).json({
          creator: "Z7:林企业",
          status: false,
          error: err.message,
          result: null,
        });
      }
    },
  },
];