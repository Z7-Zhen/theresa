import fetch from 'node-fetch';

const yt = {
  get baseUrl() {
    return { origin: 'https://ssvid.net' };
  },

  get baseHeaders() {
    return {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'origin': this.baseUrl.origin,
      'referer': this.baseUrl.origin + '/youtube-to-mp3'
    };
  },

  validateFormat(userFormat) {
    const validFormat = ['mp3', '360p', '720p', '1080p'];
    if (!validFormat.includes(userFormat)) throw new Error(`invalid format!. available formats: ${validFormat.join(', ')}`);
  },

  handleFormat(userFormat, searchJson) {
    this.validateFormat(userFormat);
    let result;
    if (userFormat === 'mp3') {
      result = searchJson.links?.mp3?.mp3128?.k;
    } else {
      const allFormats = Object.entries(searchJson.links.mp4);
      const quality = allFormats
        .map(v => v[1].q)
        .filter(v => /\d+p/.test(v))
        .map(v => parseInt(v))
        .sort((a, b) => b - a)
        .map(v => v + 'p');

      let selectedFormat = quality.includes(userFormat) ? userFormat : quality[0];
      if (selectedFormat !== userFormat) {
        console.log(`format ${userFormat} not available. fallback to ${selectedFormat}`);
      }

      const find = allFormats.find(v => v[1].q === selectedFormat);
      result = find?.[1]?.k;
    }
    if (!result) throw new Error(`${userFormat} not found`);
    return result;
  },

  async hit(path, payload) {
    try {
      const body = new URLSearchParams(payload);
      const opts = { method: 'POST', headers: this.baseHeaders, body };
      const r = await fetch(`${this.baseUrl.origin}${path}`, opts);
      console.log('hit', path);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}\n${await r.text()}`);
      return await r.json();
    } catch (e) {
      throw new Error(`${path}\n${e.message}`);
    }
  },

  async download(queryOrYtUrl, userFormat = 'mp3') {
    this.validateFormat(userFormat);

    let search = await this.hit('/api/ajax/search', {
      query: queryOrYtUrl,
      cf_token: '',
      vt: 'youtube'
    });

    if (search.p === 'search') {
      if (!search?.items?.length) throw new Error(`No results for ${queryOrYtUrl}`);
      const { v, t } = search.items[0];
      const videoUrl = 'https://www.youtube.com/watch?v=' + v;
      console.log(`[found]\ntitle : ${t}\nurl   : ${videoUrl}`);

      search = await this.hit('/api/ajax/search', {
        query: videoUrl,
        cf_token: '',
        vt: 'youtube'
      });
    }

    const vid = search.vid;
    const k = this.handleFormat(userFormat, search);

    const convert = await this.hit('/api/ajax/convert', { k, vid });

    if (convert.c_status === 'CONVERTING') {
      let convert2;
      const limit = 5;
      let attempt = 0;
      do {
        attempt++;
        console.log(`cek convert ${attempt}/${limit}`);
        convert2 = await this.hit('/api/convert/check?hl=en', {
          vid,
          b_id: convert.b_id
        });
        if (convert2.c_status === 'CONVERTED') return convert2;
        await new Promise(re => setTimeout(re, 5000));
      } while (attempt < limit && convert2.c_status === 'CONVERTING');

      throw new Error('File not ready yet');
    } else {
      return convert;
    }
  }
};

export default [
  {
    name: "Ytmp4",
    desc: "Download video YouTube",
    category: "Downloader",
    path: "/download/ytmp4?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await yt.download(url, "360p");
        res.status(200).json({
          status: true,
          result: results.dlink
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  },
  {
    name: "Ytmp3",
    desc: "Download audio YouTube",
    category: "Downloader",
    path: "/download/ytmp3?apikey=&url=",
    async run(req, res) {
      try {
        const { apikey, url } = req.query;
        if (!apikey || !global.apikey?.includes(apikey))
          return res.json({ status: false, error: "Apikey invalid" });
        if (!url)
          return res.json({ status: false, error: "Url is required" });

        const results = await yt.download(url, "mp3");
        res.status(200).json({
          status: true,
          result: results.dlink
        });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    }
  }
];
