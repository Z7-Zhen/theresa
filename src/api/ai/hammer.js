const axios = require('axios');

module.exports = function(app) {

    const UA =
        'Mozilla/5.0 (Linux Android 6.0 Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';

    async function hammerChat(message) {
        const url = 'https://www.hammerai.com/api/cloud/chat';

        const payload = {
            authorId: 'd57c4061-8098-4b48-8cab-7653cc84f84a',
            userId: '',
            licenseKey: '',
            generateChat: {
                quantizationKey: 'vllm-mistralai/Mistral-Nemo-Instruct-2407',
                characterId: '277f45fb-5510-4a7f-a359-9dd8cc6ec829',
                contextSize: 4096,
                messages: [
                    {
                        role: 'system',
                        content: `You are Luna. Write Luna's next reply. Use *gestures*.`
                    },
                    {
                        role: 'assistant',
                        characterId: '277f45fb-5510-4a7f-a359-9dd8cc6ec829',
                        content:
                            'Hello master. I was just tidying up your bedroom. Is there anything you need from me?'
                    },
                    { role: 'user', content: message }
                ],
                mlock: true,
                nPredict: 256,
                repetitionPenalty: 1.1,
                temperature: 0.8,
                topK: 30,
                topP: 0.9
            }
        };

        const res = await axios.post(url, JSON.stringify(payload), {
            headers: {
                accept: '*/*',
                'content-type': 'text/plain;charset=UTF-8',
                origin: 'https://www.hammerai.com',
                referer:
                    'https://www.hammerai.com/chat/277f45fb-5510-4a7f-a359-9dd8cc6ec829',
                'user-agent': UA,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty'
            }
        });

        // Pastikan text bersih (kadang ada karakter escape)
        let text = JSON.stringify(res.data)
            .replace(/\\"/g, '"')
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, '')
            .replace(/\\t/g, ' ')
            .replace(/\\+/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        return { text };
    }

    // Route API
    app.get('/ai/hammer', async (req, res) => {
        const { message } = req.query;

        if (!message) {
            return res.status(400).json({
                status: false,
                error: "Pesan wajib diisi"
            });
        }

        try {
            const result = await hammerChat(message);
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