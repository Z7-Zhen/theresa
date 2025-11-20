const axios = require('axios')
const cheerio = require('cheerio')

module.exports = function(app) {

  async function spotifyDl(url) {
    if (!url.includes('open.spotify.com')) {
      return {
        code: 400,
        message: 'URL harus dari Spotify'
      }
    }

    try {
      let cookie = null
      let token = null

      // Ambil cookie & CSRF token
      const Visit = async () => {
        const res = await axios.get('https://spotmate.online/en', {
          headers: {
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
          }
        })

        const setCookie = res.headers['set-cookie']
        if (setCookie) cookie = setCookie.map(c => c.split(';')[0]).join('; ')

        const $ = cheerio.load(res.data)
        token = $('meta[name="csrf-token"]').attr('content')
      }

      const Headers = () => ({
        'authority': 'spotmate.online',
        'accept': '*/*',
        'content-type': 'application/json',
        'cookie': cookie,
        'origin': 'https://spotmate.online',
        'referer': 'https://spotmate.online/en',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
        'x-csrf-token': token
      })

      if (!cookie || !token) await Visit()

      // Retry sederhana 2x jika gagal
      let info = null, convert = null
      for (let i = 0; i < 2; i++) {
        try {
          info = await axios.post('https://spotmate.online/getTrackData', { spotify_url: url }, { headers: Headers() })
          convert = await axios.post('https://spotmate.online/convert', { urls: url }, { headers: Headers() })
          break
        } catch (err) {
          if (i === 1) throw err
        }
      }

      if (!info?.data || !convert?.data?.url) {
        return {
          code: 502,
          message: 'Spotmate server sedang tidak tersedia, coba lagi nanti'
        }
      }

      const data = info.data
      const result = convert.data

      const formatDuration = ms => {
        const m = Math.floor(ms / 60000)
        const s = ((ms % 60000) / 1000).toFixed(0)
        return `${m}:${s.padStart(2, '0')}`
      }

      return {
        code: 200,
        timestamp: Date.now(),
        data: {
          title: data.name,
          artists: data.artists?.map(a => a.name).join(', '),
          album: data.album?.name,
          release: data.album?.release_date,
          duration: formatDuration(data.duration_ms),
          popularity: `${data.popularity}%`,
          cover: data.album?.images?.[0]?.url,
          spotify_url: data.external_urls?.spotify || url,
          download_url: result.url
        }
      }
    } catch (e) {
      return {
        code: 500,
        timestamp: Date.now(),
        message: e.message
      }
    }
  }

  // Route API GET: /download/spotify?url=<spotify_url>
  app.get('/download/spotify', async (req, res) => {
    const { url } = req.query
    if (!url) return res.status(400).json({ status: false, error: 'Parameter URL wajib diisi' })

    const result = await spotifyDl(url)

    if (result.code === 200) {
      res.json({
        status: true,
        creator: 'Z7:林企业',
        result: result.data
      })
    } else if (result.code === 400) {
      res.status(400).json({
        status: false,
        creator: 'Z7:林企业',
        error: result.message
      })
    } else if (result.code === 502) {
      res.status(502).json({
        status: false,
        creator: 'Z7:林企业',
        error: result.message
      })
    } else {
      res.status(500).json({
        status: false,
        creator: 'Z7:林企业',
        error: result.message || 'Gagal memproses request'
      })
    }
  })
}