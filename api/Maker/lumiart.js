import axios from "axios";
import FormData from "form-data";

export default {
  name: "LumiArt",
  desc: "AI Art generator gaya Lumi Sky Lantern Festival",
  category: "AI",
  path: "/maker/lumiart?apikey=&url=",

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
      const prompt = `Create a vertical frame – size equivalent to 1920x1080 pixels (high quality) – divided into three equally sized horizontal images seamlessly placed together. The main character is based on the reference face, hairstyle, and body: a person with a gentle and nostalgic expression, and deep, reflective eyes. They are dressed in a loose-fitting, dark-toned outfit that feels light, comfortable, and understated, evoking a sense of calm and quiet melancholy. The overall scene is set at night during a sky lantern festival, illuminated by the warm glow of golden and amber-orange tones that create a dreamy and ethereal atmosphere. Against the dark night sky, millions of glowing lanterns drift upward, lighting the air with soft, flickering light. The character’s shimmering eyes capture a mix of hope, longing, and sorrow, as they release their lantern — a symbolic act of letting go of dreams, memories, and silent wishes. Image 1 (wide shot): A low-angle shot taken from the ground, looking upward into the night sky filled with millions of glowing sky lanterns floating into the darkness. Image 2 (close-up portrait): 3/4 angled close-up capturing the character’s face from chin to forehead, focusing on the eyes. Image 3 (portrait): The character stands at the center of the frame, looking upward toward the sky, surrounded by hundreds of floating lanterns drifting into the night.`;

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