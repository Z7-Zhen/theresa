import axios from "axios";

async function downloadSoundcloud(url) {
  try {
    // 🔹 Ambil metadata SoundCloud
    const { data: info } = await axios.post(
      "https://sc.snapfirecdn.com/soundcloud",
      { target: url, gsc: "x" },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    // Pastikan struktur aman
    const sound =
      info?.sound || info?.track || info?.media || info?.data || {};
    const metadata = info?.metadata || {};

    if (!sound?.progressive_url && !sound?.url) {
      throw new Error("URL audio tidak ditemukan dalam respons API.");
    }

    // 🔹 Ambil link unduhan langsung
    const { data: dl } = await axios.get(
      `https://sc.snapfirecdn.com/soundcloud-get-dl?target=${encodeURIComponent(
        sound.progressive_url || sound.url
      )}`
    );

    return {
      success: true,
      title: sound.title || metadata.title || "Unknown Title",
      username: metadata.username || "Unknown",
      userid: metadata.userid || "N/A",
      profilePicture: metadata.profile_picture_url || null,
      artwork: metadata.artwork_url || null,
      hlsUrl: sound.hls_url || null,
      progressiveUrl: sound.progressive_url || sound.url || null,
      directMp3: dl?.url || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err.message,
    };
  }
}

export default [
  {
    name: "SoundCloud",
    desc: "Download lagu dari SoundCloud",
    category: "Downloader",
    path: "/download/soundcloud?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const result = await downloadSoundcloud(url);
        if (!result.success)
          return res.json({ status: false, error: result.error });

        res.status(200).json({
          status: true,
          creator: "Z7:林企业",
          result: {
            title: result.title,
            username: result.username,
            userid: result.userid,
            artwork: result.artwork,
            profilePicture: result.profilePicture,
            directMp3: result.directMp3,
          },
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
];