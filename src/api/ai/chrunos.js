const axios = require('axios');

module.exports = function(app) {

    async function hfChat(message) {
        const url = 'https://tecuts-chat.hf.space/chat/stream';

        const headers = {
            'accept': 'text/event-stream',
            'content-type': 'application/json',
            'origin': 'https://chrunos.com',
            'referer': 'https://chrunos.com/',
            'user-agent':
                'Mozilla/5.0 (Linux Android 6.0 Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
        };

        const payload = {
            message,
            system_prompt: 'You are a helpful assistant.',
            temperature: 0.6,
            use_search: false,
            history: [{ role: 'user', content: message }]
        };

        const res = await axios.post(url, payload, {
            headers,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            let result = '';

            res.data.on('data', chunk => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;

                    const raw = line.replace('data: ', '').trim();
                    if (!raw) continue;

                    try {
                        const json = JSON.parse(raw);

                        // Hanya ambil konten final (bukan reasoning / thinking)
                        if (json.type === 'content') {
                            let text = json.data;

                            // Skip semua yang mengandung "think"
                            if (!/think|reason|analysis/i.test(text)) {
                                result += text;
                            }
                        }

                    } catch {}
                }
            });

            res.data.on('end', () => {

                // Bersihkan semua karakter yang tidak diperlukan
                result = result
                    .replace(/\\"/g, '"')     // \" → "
                    .replace(/\\n/g, ' ')     // \n → spasi
                    .replace(/\\r/g, '')      // \r → hilang
                    .replace(/\\t/g, ' ')     // \t → spasi
                    .replace(/\\+/g, '')      // Semua backslash tersisa hilang
                    .replace(/\n+/g, ' ')     // newline → spasi
                    .replace(/\s+/g, ' ')     // multiple spaces → single
                    .trim();

                resolve({ text: result });
            });

            res.data.on('error', reject);
        });
    }

    // Route API
    app.get('/ai/chrunos', async (req, res) => {
        const { message } = req.query;

        if (!message) {
            return res.status(400).json({
                status: false,
                error: "Pesan wajib diisi"
            });
        }

        try {
            const result = await hfChat(message);
            res.json({
                status: true,
                creator: "Z7:林企业",
                result
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};