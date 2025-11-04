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

/* === FITUR API === */
export default {
  name: "GridPlus AI Edit",
  desc: "Edit gambar dengan prompt AI via GridPlus ( URL)",
  category: "AI",
  path: "/ai/gridplus?apikey=&prompt=&image=",

  async run(req, res) {
    try {
      const { apikey, prompt, image } = req.query;
      const file = req.file;

      if (!apikey || !global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      if (!prompt)
        return res.json({ status: false, error: "Prompt is required" });

      // ✅ Ambil buffer dari file atau URL
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
      const resultUrl = await grid.edit(buffer, prompt);

      res.status(200).json({
        status: true,
        result: {
          prompt,
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