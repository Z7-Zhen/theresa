import axios from "axios";
import * as cheerio from "cheerio";

async function getDonghuaUpdate() {
  try {
    const { data } = await axios.get("https://anichin.watch/schedule/");
    const $ = cheerio.load(data);
    let result = [];

    $(".postbody .schedulepage").each((i, el) => {
      const day = $(el).find("h3").text().trim() || "Unknown Day";
      let donghuaList = [];

      $(el).find(".bs").each((_, ev) => {
        let title = $(ev).find(".tt").text().trim() || "Unknown Title";
        let img = $(ev).find("img").attr("src") || null;
        let eps = $(ev).find(".bt .sb").text().trim() || "Unknown";
        let time = $(ev).find(".bt .epx").text().trim() || "Unknown";

        // Atasi tanda "??" atau kosong agar rapi
        if (eps === "??" || eps === "") eps = "Unknown";
        if (time === "??" || time === "") time = "Unknown";

        donghuaList.push({
          title,
          img,
          eps,
          time,
        });
      });

      result.push({
        day,
        total: donghuaList.length,
        donghua: donghuaList,
      });
    });

    return result;
  } catch (err) {
    throw new Error("Failed to fetch Donghua schedule: " + err.message);
  }
}

export default {
  name: "Donghua Schedule",
  desc: "Fetch weekly schedule for Donghua (Chinese Anime).",
  category: "Anime",
  path: "/anime/donghua?apikey=",

  async run(req, res) {
    try {
      const { apikey, day } = req.query;
      if (!apikey || !global.apikey.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      const data = await getDonghuaUpdate();

      // Jika query day=Monday misalnya
      if (day) {
        const filtered = data.find(
          d =>
            d.day.toLowerCase() === day.toLowerCase() ||
            d.day.toLowerCase().includes(day.toLowerCase())
        );
        if (!filtered)
          return res.json({
            status: false,
            error: `No data found for day: ${day}`,
          });
        return res.json({
          status: true,
          source: "https://anichin.watch/schedule/",
          result: filtered,
        });
      }

      // Semua hari
      res.status(200).json({
        status: true,
        source: "https://anichin.watch/schedule/",
        totalDays: data.length,
        result: data,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message,
      });
    }
  },
};