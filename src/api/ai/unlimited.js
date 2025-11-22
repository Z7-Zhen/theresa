const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

module.exports = function(app) {

    async function unlimitedai(question) {
        try {
            if (!question) throw new Error('Question is required.');

            const inst = axios.create({
                baseURL: 'https://app.unlimitedai.chat/api',
                headers: {
                    referer: 'https://app.unlimitedai.chat/id',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
                }
            });

            // Ambil token
            const { data: tokenData } = await inst.get('/token');
            if (!tokenData?.token) throw new Error('Failed to obtain token.');

            // Kirim chat
            const { data: chatData } = await inst.post('/chat', {
                messages: [{
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    role: 'user',
                    content: question,
                    parts: [
                        { type: 'text', text: question }
                    ]
                }],
                id: uuidv4(),
                selectedChatModel: 'chat-model-reasoning',
                selectedCharacter: null,
                selectedStory: null
            }, {
                headers: { 'x-api-token': tokenData.token }
            });

            // Parsing response
            const lines = typeof chatData === 'string' ? chatData.split('\n') : [];
            const line0 = lines.find(l => l.startsWith('0:'));
            if (!line0) throw new Error('No result found.');

            // Bersihkan escape quotes dan whitespace berlebih
            let result = line0.replace(/^0:/, '').trim();
            result = result.replace(/\\"/g, '"')       // \" → "
                           .replace(/^"(.*)"$/, '$1') // hapus quotes di awal & akhir
                           .replace(/\\n/g, ' ')      // \n → spasi
                           .replace(/\\r/g, '')       // \r → hilang
                           .replace(/\\t/g, ' ')      // \t → spasi
                           .replace(/\s+/g, ' ')      // multiple spaces → single
                           .trim();

            return result;

        } catch (err) {
            throw new Error(err.message || 'Unknown error.');
        }
    }

    // Route API
    app.get('/ai/unlimited', async (req, res) => {
        const { message } = req.query;

        if (!message) {
            return res.status(400).json({
                status: false,
                error: "Pesan wajib diisi"
            });
        }

        try {
            const result = await unlimitedai(message);
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