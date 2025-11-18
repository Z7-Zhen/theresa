const axios = require("axios");

module.exports = function(app) {
    async function teraboxSearch(query) {
        try {
            const base = "https://teraboxsearch.xyz";
            const ua = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";

            const getRes = await axios.get(`${base}/?q=${encodeURIComponent(query)}`, {
                headers: {
                    "User-Agent": ua,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                    "Referer": base
                },
                timeout: 15000
            });

            const setCookies = getRes.headers["set-cookie"] || [];
            const cookieHeader = setCookies.map(c => c.split(";")[0]).join("; ");

            const { data } = await axios.post(
                `${base}/api/search`,
                { query },
                {
                    headers: {
                        "User-Agent": ua,
                        "Accept": "*/*",
                        "Content-Type": "application/json",
                        "Origin": base,
                        "Referer": `${base}/?q=${encodeURIComponent(query)}`,
                        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
                        "Cookie": cookieHeader
                    },
                    timeout: 20000
                }
            );

            if (!data) return { error: "EMPTY_RESPONSE" };

            let arr = [];
            if (Array.isArray(data)) arr = data;
            else if (Array.isArray(data.results)) arr = data.results;
            else if (Array.isArray(data.items)) arr = data.items;
            else if (Array.isArray(data.data)) arr = data.data;
            else if (typeof data === "object") {
                for (const k in data) {
                    if (Array.isArray(data[k])) {
                        arr = data[k];
                        break;
                    }
                }
            }

            if (!arr.length) return { error: "NO_RESULTS", raw: data };

            return arr.map((it, i) => ({
                no: i + 1,
                title: it.title || it.name || it.filename || "-",
                url: it.url || it.link || it.download || it.file || "-",
                thumb: it.thumb || it.thumbnail || it.image || (it.meta && it.meta.thumb) || "-"
            }));

        } catch (err) {
            return { error: err.response?.status || "REQUEST_FAILED", details: err.response?.data || err.message };
        }
    }

    // Endpoint GET /tools/terabox?q=<query>
    app.get("/search/terabox", async (req, res) => {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                error: true,
                message: "Query parameter 'q' is required"
            });
        }

        try {
            const results = await teraboxSearch(query);
            res.json(results);
        } catch (err) {
            res.status(500).json({
                error: true,
                message: err.message
            });
        }
    });
};