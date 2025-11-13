import axios from "axios";
import FormData from "form-data";
import crypto from "node:crypto";
import pkg from "file-type";
const { fromBuffer } = pkg;

/* === CLASS GRIDPLUS === */
class GridPlus {
  constructor() {
    this.ins = axios.create({
      baseURL: "https://api.grid.plus/v1",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0",
        "X-AppID": "808645",
        "X-Platform": "h5",
        "X-Version": "8.9.7",
        "X-SessionToken": "",
        "X-UniqueID": this.uid(),
        "X-GhostID": this.uid(),
        "X-DeviceID": this.uid(),
        "X-MCC": "id-ID",
        sig: `XX${this.uid() + this.uid()}`,
      },
    });
  }

  uid() {
    return crypto.randomUUID().replace(/-/g, "");
  }

  form(dt) {
    const form = new FormData();
    for (const [key, value] of Object.entries(dt)) {
      form.append(key, String(value));
    }
    return form;
  }

  async upload(buff, method) {
    if (!Buffer.isBuffer(buff)) throw new Error("Data is not a buffer!");
    const { mime, ext } = (await fromBuffer(buff)) || {};
    const d = await this.ins
      .post("/ai/web/nologin/getuploadurl", this.form({ ext, method }))
      .then((i) => i.data);
    await axios.put(d.data.upload_url, buff, {
      headers: { "content-type": mime },
    });
    return d.data.img_url;
  }

  async task({ path, data, sl = () => false }) {
    const [start, interval, timeout] = [Date.now(), 3000, 60000];
    return new Promise((resolve, reject) => {
      const check = async () => {
        if (Date.now() - start > timeout)
          return reject(new Error(`Polling timed out: ${path}`));
        try {
          const dt = await this.ins({
            url: path,
            method: data ? "POST" : "GET",
            ...(data ? { data } : {}),
          });
          if (dt.errmsg?.trim()) return reject(dt.errmsg);
          if (sl(dt.data)) return resolve(dt.data);
          setTimeout(check, interval);
        } catch (e) {
          reject(e);
        }
      };
      check();
    });
  }

  async edit(buff, prompt) {
    const up = await this.upload(buff, "wn_aistyle_nano");
    const dn = await this.ins
      .post("/ai/nano/upload", this.form({ prompt, url: up }))
      .then((i) => i.data);
    if (!dn.task_id) throw new Error("task_id not found");
    const res = await this.task({
      path: `/ai/nano/get_result/${dn.task_id}`,
      sl: (dt) => dt.code === 0 && !!dt.image_url,
    });
    return res.image_url;
  }
}

/* === PROMPT DEFAULT === */
const DEFAULT_PROMPT = `
Three-frame cinematic photoshoot in a snowy winter field, matching the gender, pose, and visual style (anime/game or realistic human) of the reference subject.
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

Mood: art-house winter film still — quiet, emotional, beautifully cold — preserving the original identity, art style, and gender of the subject.
`;

/* === FITUR API === */
export default {
  name: "Snowart AI Edit",
  desc: "Edit gambar dengan GridPlus AI (prompt otomatis snow theme)",
  category: "AI",
  path: "/ai/snowart?image=",

  async run(req, res) {
    try {
      const { image } = req.query;
      const file = req.file;

      // Ambil buffer dari file atau URL
      let buffer;
      if (file) {
        buffer = file.buffer;
      } else if (image) {
        const imgRes = await axios.get(image, { responseType: "arraybuffer" });
        buffer = Buffer.from(imgRes.data);
      } else {
        return res.json({
          status: false,
          error: "Please upload an image file or provide an image URL",
        });
      }

      // Proses edit via GridPlus
      const grid = new GridPlus();
      const resultUrl = await grid.edit(buffer, DEFAULT_PROMPT);

      res.status(200).json({
        status: true,
        result: {
          prompt: "[Snowart default prompt applied]",
          input: image || "[uploaded file]",
          output: resultUrl,
          source: "https://api.grid.plus/v1",
        },
      });
    } catch (e) {
      res.status(500).json({ status: false, error: e.message });
    }
  },
};
