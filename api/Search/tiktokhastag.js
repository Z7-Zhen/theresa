import axios from "axios";
import * as cheerio from "cheerio";

async function getHashtagCount(hashtag) {
  if (!hashtag) return { error: true, message: "Hashtag parameter required" };
  try {
    const { data } = await axios.get(
      "https://tiktokhashtags.com/hashtag/" + encodeURIComponent(hashtag)
    );
    const $ = cheerio.load(data);

    const trendingSec = $("#tranding");
    const posts = $(".shortcode-html")
      .find(".col-lg-4")
      .eq(0)
      .find(".g-font-size-26")
      .text()
      .trim();
    const views = $(".shortcode-html")
      .find(".col-lg-4")
      .eq(1)
      .find(".g-font-size-26")
      .text()
      .trim();
    const viewsPerPost = $(".shortcode-html")
      .find(".col-lg-4")
      .eq(2)
      .find(".g-font-size-26")
      .text()
      .trim();
    const mostPopular = $("p1").text().trim();

    const trending = [];
    trendingSec.find("table tbody tr").each((i, el) => {
      trending.push({
        hashtag: $(el).find("td").eq(1).text().trim().replace("#", ""),
        posts: $(el).find("td").eq(2).text().trim(),
        views: $(el).find("td").eq(3).text().trim(),
        postsPerView: $(el).find("td").eq(4).text().trim(),
      });
    });

    return {
      posts,
      views,
      viewsPerPost,
      mostPopular,
      trending,
    };
  } catch (err) {
    return { error: true, message: err.message };
  }
}

export default [
  {
    name: "TikTok Hashtag Finder",
    desc: "Ambil statistik dan hashtag trending dari TikTok",
    category: "Search",
    path: "/search/hashtag?apikey=&tag=",
    async run(req, res) {
      try {
        const { apikey, tag } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!tag) return res.json({ status: false, error: "Parameter 'tag' wajib diisi" });

        const result = await getHashtagCount(tag);

        res.status(200).json({
          creator: "Z7:林企业",
          status: !result.error,
          result: result.error ? null : result,
          error: result.error ? result.message : null,
        });
      } catch (error) {
        res.status(500).json({
          creator: "Z7:林企业",
          status: false,
          error: error.message,
        });
      }
    },
  },
];