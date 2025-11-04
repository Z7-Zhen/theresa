import axios from "axios";
import * as cheerio from "cheerio";

async function textToImage(prompt) {
  try {
    const res = await axios.post(
      "https://www.texttoimage.org/generate",
      new URLSearchParams({ prompt }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest"
        }
      }
    );

    if (!res.data.success) throw new Error("Failed to generate image");

    const pageUrl = `https://www.texttoimage.org/${res.data.url}`;
    const html = await axios.get(pageUrl);
    const $ = cheerio.load(html.data);
    const imageUrl = $('meta[property="og:image"]').attr("content") || $("img").first().attr("src");

    return { prompt, pageUrl, imageUrl };
  } catch (err) {
    throw new Error(err.message);
  }
}

export default {
  name: "TextToImage",
  desc: "Generate image from text prompt",
  category: "Tools",
  path: "/tools/texttoimage?apikey=&prompt=",
  async run(req, res) {
    const { apikey, prompt } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }
    if (!prompt) {
      return res.json({ status: false, error: "Prompt is required" });
    }

    try {
      const data = await textToImage(prompt);
      res.status(200).json({ status: true, result: data });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};