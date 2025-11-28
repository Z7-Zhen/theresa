const cheerio = require("cheerio");
const axios = require("axios");

module.exports = function (app) {

    // 🔍 SEARCH ARTICLE
    async function halodocSearch(query) {
        const url = `https://www.halodoc.com/artikel/search/${encodeURIComponent(query)}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 9; Redmi 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36"
                }
            });
            const html = response.data;
            const $ = cheerio.load(html);

            const articles = [];

            $("magneto-card").each((i, el) => {
                const title = $(el).find("header a").text().trim();
                const articleLink = $(el).find("header a").attr("href");
                const imageSrc = $(el).find("img").attr("src");
                const tag = $(el).find(".tag-container a");

                if (!title) return;

                articles.push({
                    title,
                    articleLink: articleLink
                        ? "https://www.halodoc.com" + articleLink
                        : null,
                    imageSrc: imageSrc || null,
                    health: {
                        title: tag.text().trim() || null,
                        link: tag.attr("href")
                            ? "https://www.halodoc.com" + tag.attr("href")
                            : null
                    },
                    description: $(el).find(".description").text().trim() || null
                });
            });

            return articles;
        } catch (err) {
            throw new Error(`Halodoc Search Error: ${err.message}`);
        }
    }

    // 📄 DETAIL ARTICLE
    async function halodocDetail(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Linux; Android 9; Redmi 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36"
                }
            });
            const html = response.data;
            const $ = cheerio.load(html);

            return {
                title: $("h1.article-page__title").text().trim(),
                content: $("div.article-page__article-body").text().trim() || null,
                info: {
                    time: $("span.article-page__reading-time").text().trim() || null,
                    author: $("div.article-page__reviewer a").text().trim() || null
                },
                meta: {
                    link: $('meta[property="og:url"]').attr("content") || url,
                    image: $('meta[property="og:image"]').attr("content") || null
                }
            };
        } catch (err) {
            throw new Error(`Halodoc Detail Error: ${err.message}`);
        }
    }

    // 🔥 ROUTE: SEARCH
    app.get("/search/halodoc", async (req, res) => {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: "Parameter ?query= wajib" });

        try {
            const data = await halodocSearch(query);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 🔥 ROUTE: DETAIL
    app.get("/info/halodoc", async (req, res) => {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: "Parameter ?url= wajib" });

        try {
            const data = await halodocDetail(url);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

};