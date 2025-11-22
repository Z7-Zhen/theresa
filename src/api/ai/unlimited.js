const axios = require('axios');

module.exports = function(app) {

    async function unlimitedai(question) {
        if (!question) throw new Error('Question is required.');

        // import uuidv4 secara dinamis
        const { v4: uuidv4 } = await import('uuid');

        const inst = axios.create({
            baseURL: 'https://app.unlimitedai.chat/api',
            headers: {
                referer: 'https://app.unlimitedai.chat/id',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        const { data: tokenData } = await inst.get('/token');
        if (!tokenData?.token) throw new Error('Failed to obtain token.');

        const { data: chatData } = await inst.post('/chat', {
            messages: [{
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                role: 'user',
                content: question,
                parts: [{ type: 'text', text: question }]
            }],
            id: uuidv4(),
            selectedChatModel: 'chat-model-reasoning',
            selectedCharacter: null,
            selectedStory: null
        }, {
            headers: { 'x-api-token': tokenData.token }
        });

        const lines = typeof chatData === 'string' ? chatData.split('\n') : [];
        const line0 = lines.find(l => l.startsWith('0:'));
        if (!line0) throw new Error('No result found.');

        let result = line0.replace(/^0:/, '').trim();
        result = result.replace(/\\"/g, '"')
                       .replace(/^"(.*)"$/, '$1')
                       .replace(/\\n/g, ' ')
                       .replace(/\\r/g, '')
                       .replace(/\\t/g, ' ')
                       .replace(/\s+/g, ' ')
                       .trim();

        return result;
    }

    // Route API
    app.get('/ai/unlimited', async (req, res) => {
        const { message } = req.query;

        if (!message) return res.status(400).json({ status: false, error: "Pesan wajib diisi" });

        try {
            const result = await unlimitedai(message);
            res.json({ status: true, creator: "Z7:林企业", result });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};