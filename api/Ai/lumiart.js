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
Create a vertical frame – size equivalent to 1920x1080 pixels (high quality) – divided into three equally sized horizontal images seamlessly placed together. The main character is based on the reference face, hairstyle, and body: a person with a gentle and nostalgic expression, and deep, reflective eyes. They are dressed in a loose-fitting, dark-toned outfit that feels light, comfortable, and understated, evoking a sense of calm and quiet melancholy. The overall scene is set at night during a sky lantern festival, illuminated by the warm glow of golden and amber-orange tones that create a dreamy and ethereal atmosphere. Against the dark night sky, millions of glowing lanterns drift upward, lighting the air with soft, flickering light. The character’s shimmering eyes capture a mix of hope, longing, and sorrow, as they release their lantern — a symbolic act of letting go of dreams, memories, and silent wishes. Image 1 (wide shot): A low-angle shot taken from the ground, looking upward into the night sky filled with millions of glowing sky lanterns floating into the darkness. Image 2 (close-up portrait): 3/4 angled close-up capturing the character’s face from chin to forehead, focusing on the eyes. Image 3 (portrait): The character stands at the center of the frame, looking upward toward the sky, surrounded by hundreds of floating lanterns drifting into the night.
`;

/* === FITUR API === */
export default {
  name: "LumiArt AI Edit",
  desc: "Edit gambar dengan GridPlus AI (prompt otomatis)",
  category: "AI",
  path: "/ai/lumiart?image=",

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
          error: "Please upload image file or provide image URL",
        });
      }

      // Proses edit via GridPlus
      const grid = new GridPlus();
      const resultUrl = await grid.edit(buffer, DEFAULT_PROMPT);

      res.status(200).json({
        status: true,
        result: {
          prompt: "[DEFAULT prompt applied]",
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
