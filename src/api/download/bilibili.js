const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('node:fs').promises;
const { exec } = require('child_process');
const { promisify } = require('node:util');
const execPromise = promisify(exec);

module.exports = function(app) {

    async function bilibilidl(url, quality = '480P') {
        try {
            let aid = /\/video\/(\d+)/.exec(url)?.[1];
            if (!aid) throw new Error('Video ID tidak ditemukan');

            const appInfo = await axios.get(url).then(res => res.data);
            const $ = cheerio.load(appInfo);

            const title = $('meta[property="og:title"]').attr('content')?.split('|')[0]?.trim();
            const description = $('meta[property="og:description"]').attr('content');
            const type = $('meta[property="og:video:type"]').attr('content');
            const cover = $('meta[property="og:image"]').attr('content');
            const like = $('.interactive__btn.interactive__like .interactive__text').text();
            const views = $('.bstar-meta__tips-left .bstar-meta-text').first().text().replace(' Ditonton', '');

            const response = await axios.get('https://api.bilibili.tv/intl/gateway/web/playurl', {
                params: {
                    's_locale': 'id_ID',
                    'platform': 'web',
                    'aid': aid,
                    'qn': '64',
                    'type': '0',
                    'device': 'wap',
                    'tf': '0',
                    'spm_id': 'bstar-web.ugc-video-detail.0.0',
                    'from_spm_id': 'bstar-web.homepage.trending.all',
                    'fnval': '16',
                    'fnver': '0'
                }
            }).then(res => res.data);

            const selectedVideo = response.data.playurl.video.find(
                v => v.stream_info.desc_words === quality
            );
            if (!selectedVideo) throw new Error('Quality tidak ditemukan');

            const videoUrl = selectedVideo.video_resource.url || selectedVideo.video_resource.backup_url[0];
            const audioUrl = response.data.playurl.audio_resource[0].url ||
                             response.data.playurl.audio_resource[0].backup_url[0];

            async function downloadBuffer(url) {
                const buffers = [];
                let start = 0;
                let end = 5 * 1024 * 1024;
                let fileSize = 0;

                while (true) {
                    const range = `bytes=${start}-${end}`;
                    const res = await axios.get(url, {
                        headers: {
                            'DNT': '1',
                            'Origin': 'https://www.bilibili.tv',
                            'Referer': 'https://www.bilibili.tv/',
                            'User-Agent': 'Mozilla/5.0',
                            Range: range
                        },
                        responseType: 'arraybuffer'
                    });

                    if (fileSize === 0) {
                        const contentRange = res.headers['content-range'];
                        if (contentRange) {
                            fileSize = parseInt(contentRange.split('/')[1]);
                        }
                    }

                    buffers.push(Buffer.from(res.data));

                    if (end >= fileSize - 1) break;

                    start = end + 1;
                    end = Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1);
                }

                return Buffer.concat(buffers);
            }

            const videoBuffer = await downloadBuffer(videoUrl);
            const audioBuffer = await downloadBuffer(audioUrl);

            const vPath = 'temp_video.mp4';
            const aPath = 'temp_audio.mp3';
            const outPath = 'temp_output.mp4';

            await fs.writeFile(vPath, videoBuffer);
            await fs.writeFile(aPath, audioBuffer);

            await execPromise(`ffmpeg -i "${vPath}" -i "${aPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${outPath}"`);
            const mergedBuffer = await fs.readFile(outPath);

            await Promise.all([
                fs.unlink(vPath).catch(() => {}),
                fs.unlink(aPath).catch(() => {}),
                fs.unlink(outPath).catch(() => {})
            ]);

            return {
                title,
                description,
                type,
                cover,
                views,
                like,
                buffer: mergedBuffer
            };

        } catch (err) {
            throw new Error(err.message);
        }
    }

    app.get('/download/bilibili', async (req, res) => {
        const { url, quality } = req.query;

        if (!url) {
            return res.status(400).json({
                status: false,
                error: "Parameter 'url' wajib diisi!"
            });
        }

        try {
            const data = await bilibilidl(url, quality || '480P');

            res.json({
                status: true,
                creator: "Z7:林企业",
                info: {
                    title: data.title,
                    description: data.description,
                    cover: data.cover,
                    views: data.views,
                    like: data.like,
                    type: data.type
                },
                video: data.buffer.toString("base64")
            });

        } catch (e) {
            res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};