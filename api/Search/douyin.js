import axios from "axios";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false }); // Bypass SSL untuk Termux/VPS

async function fetchDouyin(keyword) {
  try {
    if (!keyword) throw new Error("Masukkan kata kunci pencarian.");

    const encoded = encodeURIComponent(keyword);
    const url = `https://www.douyin.com/aweme/v1/web/general/search/single/?device_platform=webapp&aid=6383&channel=channel_pc_web&search_channel=aweme_general&enable_history=1&keyword=${encoded}&search_source=normal_search&query_correct_type=1&is_filter_search=0&offset=0&count=10`;

    const headers = {
      "accept": "application/json, text/plain, */*",
      "accept-language": "id-ID,id;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
      "referer": `https://www.douyin.com/root/search/${encoded}?type=general`,
      "cookie":
        "s_v_web_id=verify_me5d6fih_IX6PCIGA_twP0_4zgA_8EqK_cyQRrxomnYdv;", // Optional cookie
    };

    const { data } = await axios.get(url, { headers, httpsAgent: agent });

    if (!data?.data) return { total: 0, result: [] };

    const result = [];

    for (const item of data.data) {
      const aweme = item?.aweme_info;
      if (!aweme) continue;

      result.push({
        id: aweme.aweme_id,
        desc: aweme.desc || "Tanpa deskripsi",
        author: aweme.author?.nickname || "Tidak diketahui",
        cover: aweme.video?.cover?.url_list?.[0],
        play: aweme.video?.play_addr?.url_list?.[0],
        music: {
          title: aweme.music?.title || "-",
          author: aweme.music?.author || "-",
          url: aweme.music?.play_url?.url_list?.[0] || "",
        },
        stats: {
          digg_count: aweme.statistics?.digg_count || 0,
          share_count: aweme.statistics?.share_count || 0,
          comment_count: aweme.statistics?.comment_count || 0,
          play_count: aweme.statistics?.play_count || 0,
        },
      });
    }

    return { total: result.length, result };
  } catch (err) {
    console.error("Douyin Fetch Error:", err.message);
    throw new Error("Gagal mengambil data Douyin. Periksa koneksi atau struktur API-nya.");
  }
}

export default {
  name: "Douyin",
  desc: "Search Douyin (TikTok China) videos by keyword",
  category: "Search",
  path: "/search/douyin?apikey=&q=",
  async run(req, res) {
    try {
      const { apikey, q } = req.query;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.status(403).json({ status: false, error: "Apikey invalid" });
      }

      if (!q) {
        return res.status(400).json({
          status: false,
          error: "Parameter 'q' (keyword) wajib diisi. Contoh: /video/douyin?q=girl dance",
        });
      }

      const data = await fetchDouyin(q);

      res.status(200).json({
        creator: "Z7:林企业",
        status: true,
        keyword: q,
        total: data.total,
        result: data.result,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },
};