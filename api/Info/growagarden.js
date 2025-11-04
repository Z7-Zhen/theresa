import axios from "axios";

const gardenStock = {
  base: "https://www.gamersberg.com",

  headers: {
    "user-agent": "Mozilla/5.0 (Linux; Android 10)",
    "accept-language": "id,en;q=0.9",
    "x-requested-with": "idm.internet.download.manager.plus",
    referer: "https://www.gamersberg.com/sw.js"
  },

  image: (type, name) =>
    `https://www.gamersberg.com/grow-a-garden/stock/${type}/${name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9\-]/g, "")}.webp`,

  /**
   * 🔹 Ambil data stok Grow a Garden
   */
  check: async () => {
    try {
      const { data } = await axios.get(
        "https://www.gamersberg.com/api/grow-a-garden/stock",
        { headers: gardenStock.headers, timeout: 10000 }
      );

      const payload = data?.data?.[0];
      if (!payload) {
        return {
          status: false,
          creator: "Z7:林企业",
          error: "Data tidak ditemukan"
        };
      }

      const {
        playerName,
        userId,
        sessionId,
        updateNumber,
        timestamp,
        weather,
        seeds,
        gear,
        eggs,
        cosmetic,
        event,
        honeyevent,
        nightevent,
        traveling
      } = payload;

      const format = (obj, type) =>
        Object.entries(obj).map(([name, quantity]) => ({
          name,
          quantity: Number(quantity),
          image: gardenStock.image(type, name)
        }));

      const eggx = eggs.map(({ name, quantity }) => ({
        name,
        quantity: Number(quantity),
        image: gardenStock.image("eggs", name)
      }));

      return {
        status: true,
        creator: "Z7:林企业",
        result: {
          updated: new Date().toISOString(),
          user: { playerName, userId, sessionId },
          garden: {
            updateNumber,
            timestamp,
            weather,
            seeds: format(seeds, "seeds"),
            gear: format(gear, "gear"),
            cosmetic: format(cosmetic, "cosmetics"),
            eggs: eggx,
            event,
            honeyevent,
            nightevent,
            traveling
          },
          meta: data.meta
        }
      };
    } catch (err) {
      return {
        status: false,
        creator: "Z7:林企业",
        error: err.message
      };
    }
  }
};

/**
 * 🔹 Route Handler untuk /info/growagarden
 */
export default {
  name: "Grow A Garden Info",
  desc: "Menampilkan data terbaru event Grow a Garden (GamersBerg)",
  category: "Info",
  path: "/info/growagarden?apikey=",
  async run(req, res) {
    try {
      const { apikey } = req.query;
      if (!global.apikey?.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });

      const result = await gardenStock.check();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        error: error.message
      });
    }
  }
};