import axios from "axios";
import * as cheerio from "cheerio";

async function washi(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const contentTitle = $("#firstHeading").text().trim();

  const content = [];
  $("#mw-content-text .mw-parser-output > p").each((i, el) => {
    const text = $(el).text().replace(/\[\d+\]/g, "").trim();
    if (text) content.push(text);
  });

  const images = [];
  $("#mw-content-text .mw-parser-output img").each((i, el) => {
    if (i >= 3) return false;
    const src = $(el).attr("src");
    if (src) images.push(src.startsWith("http") ? src : "https:" + src);
  });

  const infobox = {};
  $(".infobox tr").each((i, el) => {
    const th = $(el).find("th").first().text().trim();
    const tdEl = $(el).find("td").first();
    let td = "";
    if (tdEl.find("li").length) {
      td = tdEl
        .find("li")
        .map((i, li) => $(li).text().trim())
        .get()
        .join(", ");
    } else {
      td = tdEl.text().trim();
    }
    td = td.replace(/\[\w+\]/g, "");
    if (th && td) infobox[th] = td;
  });

  return { 
    title: contentTitle, 
    summary: content.slice(0, 7), 
    images, 
    infobox 
  };
}

export default {
  name: "Wikipedia",
  desc: "Ambil informasi, ringkasan, dan infobox dari artikel Wikipedia",
  category: "Info",
  path: "/info/wikipedia?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    if (!url)
      return res.json({ status: false, error: "Url is required" });

    try {
      const result = await washi(url);
      res.status(200).json({ status: true, result });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  }
};