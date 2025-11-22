const axios = require('axios');

module.exports = function(app) {

    async function webpilot(query) {
        try {
            if (!query) throw new Error('Query is required');

            const { data } = await axios.post(
                'https://api.webpilotai.com/rupee/v1/search',
                {
                    q: query,
                    threadId: ''
                },
                {
                    headers: {
                        authority: 'api.webpilotai.com',
                        accept: 'application/json, text/plain, */*, text/event-stream',
                        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                        authorization: 'Bearer null',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json;charset=UTF-8',
                        origin: 'https://www.webpilot.ai',
                        pragma: 'no-cache',
                        referer: 'https://www.webpilot.ai/',
                        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
                        'sec-ch-ua-mobile': '?1',
                        'sec-ch-ua-platform': '"Android"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'cross-site',
                        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
                    }
                }
            );

            let chat = '';
            const source = [];

            // Parsing SSE-like response
            data.split('\n').forEach(line => {
                if (!line.startsWith('data:')) return;
                try {
                    const json = JSON.parse(line.slice(5));
                    if (json.type === 'data' && json?.data?.section_id === void 0 && json?.data?.content) {
                        chat += json.data.content;
                    }
                    if (json.action === 'using_internet' && json.data) {
                        source.push(json.data);
                    }
                } catch {}
            });

            // Bersihkan backslash atau karakter escape
            chat = chat.replace(/\\"/g, '"')
                       .replace(/^"(.*)"$/, '$1')
                       .replace(/\\n/g, ' ')
                       .replace(/\\r/g, '')
                       .replace(/\\t/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();

            return { chat, source };

        } catch (err) {
            throw new Error(err.message || 'Unknown error');
        }
    }

    // Route API
    app.get('/ai/webpilot', async (req, res) => {
        const { message } = req.query;

        if (!message) {
            return res.status(400).json({
                status: false,
                error: "Pesan wajib diisi"
            });
        }

        try {
            const result = await webpilot(message);
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