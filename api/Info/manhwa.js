import axios from "axios";
import  * as cheerio from "cheerio";

/* === FUNGSIONALITAS WEBTOONS DETAIL === */
async function WebtoonsDetail(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const result = {
      title: $(".detail_header .subj").text().trim(),
      genre: $(".detail_header .genre").text().trim(),
      authors: [],
      description: $(".summary").text().trim(),
      thumbnail: $(".detail_header .thmb img").attr("src"),
      backgroundImage: $(".detail_bg")
        .attr("style")
        ?.replace("background:url('", "")
        .replace("') repeat-x", ""),
      stats: {
        views: $(".grade_area li:first-child .cnt").text().trim(),
        subscribers: $(".grade_area li:last-child .cnt").text().trim(),
      },
      updateSchedule: $(".day_info").text().trim().replace("Baca Tiap ", ""),
      ageRating: $(".age_text").text().trim(),
      episodes: [],
      recommendations: [],
    };

    const writer = $(".ly_creator_in .title").first().text().trim();
    const illustrator = $(".ly_creator_in .title").last().text().trim();
    if (writer && illustrator) result.authors = [writer, illustrator];

    $("#_listUl ._episodeItem").each((index, element) => {
      const $episode = $(element);
      const episodeData = {
        episodeNo: $episode.attr("id")?.replace("episode_", ""),
        title: $episode.find(".subj span").text().trim(),
        date: $episode.find(".date").text().trim(),
        likes: $episode.find(".like_area").text().trim().replace("like", "").trim(),
        thumbnail: $episode.find(".thmb img").attr("src"),
        link: $episode.find("a").attr("href"),
        episodeNumber: $episode.find(".tx").text().trim(),
      };
      result.episodes.push(episodeData);
    });

    $(".detail_other .lst_type1 li").each((index, element) => {
      const $rec = $(element);
      const recommendation = {
        title: $rec.find(".subj").text().trim(),
        author: $rec.find(".author").text().trim(),
        views: $rec.find(".grade_num").text().trim(),
        thumbnail: $rec.find(".pic_area img").attr("src"),
        link: $rec.find("a").attr("href"),
      };
      result.recommendations.push(recommendation);
    });

    return result;
  } catch (error) {
    throw new Error("Error fetching Webtoons data: " + error.message);
  }
}

/* === PLUGIN MODULAR === */
export default {
  name: "Manwha Detail",
  desc: "Ambil detail komik Webtoons dari URL",
  category: "Info",
  path: "/info/manwha?apikey=&url=",

  async run(req, res) {
    try {
      const { apikey, url } = req.query;

      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      if (!url)
        return res.json({ status: false, error: "Url is required" });

      const result = await WebtoonsDetail(url);

      res.status(200).json({
        status: true,
        result,
      });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  },
};