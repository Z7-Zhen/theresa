import fetch from 'node-fetch';

async function downloadSingleFormat(url, format) {
  const staticData = Object.freeze({
    baseUrl: 'https://cnv.cx',
    headers: {
      'accept-encoding': 'gzip, deflate, br, zstd',
      'origin': 'https://frame.y2meta-uk.com',
    }
  });

  // get key
  const keyRes = await fetch(staticData.baseUrl + '/v2/sanity/key', {
    headers: staticData.headers
  });
  if (!keyRes.ok) throw new Error(`${keyRes.status} ${keyRes.statusText} in getKey`);
  const { key } = await keyRes.json();

  // resolve payload
  const availableFormats = ['128k','320k','144p','240p','360p','720p','1080p'];
  if (!availableFormats.includes(format)) throw new Error(`Invalid format: ${format}`);
  const ftype = format.endsWith('k') ? 'mp3' : 'mp4';
  const audioBitrate = ftype === 'mp3' ? parseInt(format) + '' : '128';
  const videoQuality = ftype === 'mp4' ? parseInt(format) + '' : '720';

  const payload = {
    link: url,
    format: ftype,
    audioBitrate,
    videoQuality,
    filenameStyle: 'pretty',
    vCodec: 'h264'
  };

  // convert
  const convRes = await fetch(staticData.baseUrl + '/v2/converter', {
    method: 'POST',
    headers: { key, ...staticData.headers },
    body: new URLSearchParams(payload)
  });
  if (!convRes.ok) throw new Error(`${convRes.status} ${convRes.statusText} in convert`);
  const { url: dlUrl, filename } = await convRes.json();

  // download buffer
  const r = await fetch(dlUrl, { headers: { referer: 'https://v6.www-y2mate.com/' } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} in getBuffer`);
  const buffer = Buffer.from(await r.arrayBuffer());

  const sanitizedFileName = filename.replaceAll(/[^A-Za-z0-9]/g, '_').replace(/_+/g,'_').toLowerCase();

  return { fileName: sanitizedFileName, buffer };
}

export default {
  name: "YouTube Downloader",
  desc: "Download YouTube video/audio semua format, return base64",
  category: "Tools",
  path: "/tools/yt?apikey=&url=",
  
  async run(req, res) {
    const { apikey, url } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: 'Apikey invalid' });
    }

    if (!url) {
      return res.json({ status: false, error: 'Url is required' });
    }

    const formats = ['128k','320k','144p','240p','360p','720p','1080p'];
    const results = [];

    for (let f of formats) {
      try {
        const { fileName, buffer } = await downloadSingleFormat(url, f);
        results.push({ fileName, format: f, data: buffer.toString('base64') });
      } catch (err) {
        results.push({ fileName: null, format: f, error: err.message });
      }
    }

    return res.json({ status: true, url, files: results });
  }
};
