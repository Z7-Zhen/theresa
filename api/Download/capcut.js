import axios from "axios";

/**
 * Scraper CapCut Template
 * @param {string} url - URL Template CapCut
 * @returns {Promise<Object>}
 */
async function wakata(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1",
      },
    });

    const html = res.data;
    const match = html.match(/"structuredData":({.*?}),"bizCode"/);
    if (!match) throw new Error("structuredData not found");

    const jsonText = match[1];
    const data = JSON.parse(jsonText);

    const decodeUrl = (str) =>
      str?.replace(/\\u002F/g, "/").replace(/^https:\\/, "https://");

    return {
      title: data.name || "",
      description: data.description || "",
      thumbnail: decodeUrl(data.thumbnailUrl || ""),
      video: decodeUrl(data.contentUrl || ""),
      author: data.creator?.name || "",
      avatar: decodeUrl(data.creator?.avatarUrl || ""),
      duration: data.duration || 0,
      likes: data.interactionStatistic?.likeCount || 0,
      uses: data.interactionStatistic?.useCount || 0,
    };
  } catch (e) {
    throw new Error(e.message);
  }
}

export default {
  name: "CapCut",
  desc: "Ambil data dan video template dari CapCut",
  category: "Downloader",
  path: "/download/capcut?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!url)
      return res.json({ status: false, error: "Url is required" });

    try {
      const result = await wakata(url);
      res.status(200).json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  },
};