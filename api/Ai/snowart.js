import axios from "axios";
import FormData from "form-data";

export default {
  name: "Snow art",
  desc: "AI Art generator gaya Salju",
  category: "AI",
  path: "/ai/snowart?apikey=&url=",

  async run(req, res) {
    const { apikey, url } = req.query;

    // 🔐 Validasi apikey
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    if (!url) {
      return res.json({
        status: false,
        error: "Missing parameter: url (harus URL gambar publik)",
      });
    }

    try {
      // 🎨 Prompt LumiArt default (fix & high quality)
      const prompt = `Three-frame cinematic photoshoot in a snowy winter field, matching the gender, pose, and visual style (anime/game or realistic human) of the reference subject.
Preserve the original art style — if the reference is an anime or game character, keep anime-style proportions, cel shading, and line art.
If the reference is a real person, keep realistic human proportions, textures, and skin details.

Style: cinematic composition, melancholic winter atmosphere, soft cold bluish lighting, shallow depth of field, gentle bokeh, softly falling snow.
The subject (keep same gender and appearance style as reference) holds a transparent umbrella.

Outfit: same inner clothing style as in the reference (light grey fitted top), layered with a dark padded puffer jacket or slightly open winter coat, and a black scarf.
For lower clothing, match to gender — fitted winter trousers or jeans for male, warm slim-fit pants or leggings for female.

Hair: keep the hairstyle and color true to the reference (do not convert between anime and human styles).

Frames:
1️⃣ Top: close-up portrait under umbrella, looking to the side with a soft, thoughtful expression, snow resting on the umbrella.
2️⃣ Middle: full-body shot standing in the snowy field, umbrella above head, facing camera, softly blurred snow-covered trees in background.
3️⃣ Bottom: extreme close-up of face under umbrella, cinematic shallow focus on eyes and lips, with soft snowflakes visible on skin or umbrella surface.

Mood: art-house winter film still — quiet, emotional, beautifully cold — preserving the original identity, art style, and gender of the subject.`;

      // 🚀 Kirim ke API editfoto eksternal
      const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(
        url
      )}&prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

      const buffer = Buffer.from(response.data);

      // 🖼️ Kirim hasil ke client (langsung gambar)
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length,
      });
      res.end(buffer);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  },
};