import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchWebtoons() {
    try {
        const response = await axios.get('https://www.webtoons.com/id/');
        const html = response.data;
        const $ = cheerio.load(html);

        const result = {
            trending: [],
            popular: []
        };

        $('._trending_title_a').each((index, element) => {
            const $el = $(element);
            const rank = parseInt($el.attr('data-rank'));
            const title = $el.find('.title').text().trim();
            const title_no = parseInt($el.attr('data-title-no'));
            const genre = $el.find('.genre').text().trim();
            const url = $el.attr('href');
            const thumbnail = $el.find('img').attr('src');

            if (rank && title) {
                result.trending.push({ rank, title, title_no, genre, url, thumbnail });
            }
        });

        $('._popular_title_a').each((index, element) => {
            const $el = $(element);
            const rank = parseInt($el.attr('data-rank'));
            const title = $el.find('.title').text().trim();
            const title_no = parseInt($el.attr('data-title-no'));
            const genre = $el.find('.genre').text().trim();
            const url = $el.attr('href');
            const thumbnail = $el.find('img').attr('src');

            if (rank && title) {
                result.popular.push({ rank, title, title_no, genre, url, thumbnail });
            }
        });

        result.trending.sort((a, b) => a.rank - b.rank);
        result.popular.sort((a, b) => a.rank - b.rank);

        return result;

    } catch (error) {
        console.error('Error fetching Webtoons:', error);
        throw new Error('Failed to fetch Webtoons data');
    }
}

export default {
    name: "Manwha",
    desc: "Get trending & popular Webtoons / Manwha",
    category: "Anime",
    path: "/anime/manwha?apikey=",
    async run(req, res) {
        const { apikey } = req.query;

        if (!apikey || !global.apikey.includes(apikey)) {
            return res.json({ status: false, error: "Apikey invalid" });
        }

        try {
            const data = await fetchWebtoons();
            res.status(200).json({ status: true, result: data });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    }
};