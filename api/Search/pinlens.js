import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import 'dotenv/config';
/*
 * Pinterest Lens Search API
 * Dibuat oleh siputzx
 * Dikonversi & disusun ulang jadi endpoint API oleh AI
 */

class PinterestLensScraper {
  constructor(authToken) {
    this.authToken = authToken;
  }

  getRandomHeaders() {
    const devices = [
      { model: 'SM-G991B', manufacturer: 'samsung' },
      { model: 'Pixel 6', manufacturer: 'Google' },
      { model: 'M2101K6G', manufacturer: 'Xiaomi' },
      { model: 'CPH2121', manufacturer: 'OPPO' },
      { model: 'RMX3085', manufacturer: 'realme' },
    ];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const version = ['13.36.2', '13.35.0', '13.34.1'][Math.floor(Math.random() * 3)];
    const androidVer = ['11', '12', '13'][Math.floor(Math.random() * 3)];

    return {
      'User-Agent': `Pinterest for Android/${version} (${device.model}; ${androidVer})`,
      'accept-language': 'id-ID',
      'authorization': `Bearer ${this.authToken}`,
      'x-pinterest-device': device.model,
      'x-pinterest-device-manufacturer': device.manufacturer,
    };
  }

  getFields() {
    return 'pin.{id,title,description,images[736x,236x],dominant_color,pinner(),board(),aggregated_pin_data(),comment_count,created_at,is_video,link,domain},user.{id,username,full_name,image_medium_url},board.{id,name,url},aggregatedpindata.{aggregated_stats}';
  }

  async searchByImage(imageBuffer, pageSize = 10) {
    const data = new FormData();
    data.append('camera_type', '0');
    data.append('source_type', '1');
    data.append('video_autoplay_disabled', '0');
    data.append('fields', this.getFields());
    data.append('page_size', pageSize.toString());
    data.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

    const response = await axios.post(
      'https://api.pinterest.com/v3/visual_search/lens/search/',
      data,
      { headers: { ...this.getRandomHeaders(), ...data.getHeaders() } }
    );

    return this.parseResults(response.data);
  }

  parseResults(response) {
    const pins = response.data.map((pin) => ({
      id: pin.id,
      title: pin.title || '',
      description: pin.description || '',
      imageUrl: pin.images?.['736x']?.url || pin.images?.originals?.url,
      thumbnailUrl: pin.images?.['236x']?.url,
      creator: {
        username: pin.pinner?.username,
        fullName: pin.pinner?.full_name,
        imageUrl: pin.pinner?.image_medium_url,
      },
      domain: pin.domain || '',
      link: pin.link || '',
    }));

    return { count: pins.length, pins };
  }
}

export default [
  {
    name: 'Pinterest Lens',
    desc: 'Cari gambar serupa di Pinterest menggunakan URL gambar.',
    category: 'Search',
    path: '/search/pinlens?apikey=&image=',
    async run(req, res) {
      try {
        const { apikey, image } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: 'Apikey invalid' });

        if (!image) return res.json({ status: false, error: 'Image URL is required' });

        // Download gambar dulu ke buffer
        const imgBuffer = (await axios.get(image, { responseType: 'arraybuffer' })).data;
        const scraper = new PinterestLensScraper(process.env.PINTEREST_TOKEN || '');

        const results = await scraper.searchByImage(imgBuffer, 10);

        res.status(200).json({
          creator: 'Z7:林企业',
          status: true,
          total: results.count,
          result: results.pins,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({
          creator: 'Z7:林企业',
          status: false,
          error: err.message || 'Internal Server Error',
        });
      }
    },
  },
];