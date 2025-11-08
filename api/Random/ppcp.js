import axios from 'axios'

async function getPPCouple() {
  try {
    const { data } = await axios.get('https://raw.githubusercontent.com/KazukoGans/database/main/anime/ppcouple.json')
    const random = data[Math.floor(Math.random() * data.length)]
    return {
      male: random.cowo,
      female: random.cewe
    }
  } catch (error) {
    console.error("Error fetching couple data:", error)
    throw new Error("Gagal mengambil data PP Couple.")
  }
}

export default {
  name: "PP Couple",
  desc: "Menampilkan foto profil pasangan anime (cowok dan cewek).",
  category: "Random",
  path: "/random/ppcouple?apikey=",
  async run(req, res) {
    const { apikey } = req.query

    // Validasi API key
    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.status(403).json({
        status: false,
        message: "Apikey tidak valid!",
      })
    }

    try {
      const result = await getPPCouple()

      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result
      })
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      })
    }
  },
}
