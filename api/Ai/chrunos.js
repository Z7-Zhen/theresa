import axios from "axios";

/* === 💡 KELAS CHRUNOS AI === */
class ChrunosAI {
  constructor() {
    this.base = "https://tecuts-chat.hf.space/chat/stream";
    this.headers = {
      accept: "text/event-stream",
      "content-type": "application/json",
      origin: "https://chrunos.com",
      referer: "https://chrunos.com/",
      "user-agent":
        "Mozilla/5.0 (Linux Android 6.0 Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
    };
  }

  async chat(prompt) {
    if (!prompt) throw new Error("Teks pertanyaan tidak boleh kosong!");

    const payload = {
      message: prompt,
      system_prompt: "You are a helpful assistant.",
      temperature: 0.6,
      use_search: false,
      history: [{ role: "user", content: prompt }],
    };

    const res = await axios.post(this.base, payload, {
      headers: this.headers,
      responseType: "stream",
    });

    return new Promise((resolve) => {
      let result = "";

      res.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.replace("data: ", "").trim();
          if (!raw) continue;

          try {
            const json = JSON.parse(raw);
            if (json.type === "content") {
              const text = json.data;
              if (!text.includes("think")) result += text;
            }
          } catch {}
        }
      });

      res.data.on("end", () => resolve(result.trim()));
    });
  }
}

/* === 🚀 FITUR API: CHRUNOS AI === */
export default {
  name: "Chrunos AI",
  desc: "Chat AI streaming berbasis model Chrunos (tecuts-chat.hf.space)",
  category: "AI",
  path: "/ai/chrunos?text=",

  async run(req, res) {
    try {
      const { text } = req.query;
      if (!text)
        return res.json({ status: false, error: "Parameter 'text' dibutuhkan." });

      const ai = new ChrunosAI();
      const output = await ai.chat(text);

      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        base: "https://chrunos.com",
        link_gc: "https://chat.whatsapp.com/Gfs8vBXnCqG8sPFVgTiSIV?mode=wwt",
        input: text,
        output,
      });
    } catch (e) {
      res.status(500).json({
        status: false,
        error: e.message || "Terjadi kesalahan internal pada server AI.",
      });
    }
  },
};
