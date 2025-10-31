import axios from 'axios';

function encodeEmoji(emoji) {
  return [...emoji].map(char => char.codePointAt(0).toString(16)).join('-');
}

async function getBuffer(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

export default {
  name: "Emoji To Gif",
  desc: "Convert emoji to gif",
  category: "Maker",
  path: "/maker/emojitogif?apikey=&emoji=",
  async run(req, res) {
    const { apikey, emoji } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!emoji) {
      return res.json({ status: false, error: 'Emoji is required' });
    }

    try {
      const code = encodeEmoji(emoji);
      const buffer = await getBuffer(`https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`);
      
      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Content-Length': buffer.length
      });
      res.end(buffer);
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  }
};