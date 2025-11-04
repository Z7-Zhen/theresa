import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeDonghubAllMovies() {
  const baseUrl = 'https://donghub.vip/anime/page/';
  const allMovies = [];
  let page = 1;

  try {
    while (true) {
      const url = `${baseUrl}${page}/?status=&type=Movie&order=update`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const movies = [];

      $('.listupd .bs').each((index, element) => {
        const title = $(element).find('.tt h2').text().trim();
        const movieUrl = $(element).find('.bsx > a').attr('href');
        const imageUrl = $(element).find('.limit img').attr('src');
        const status = $(element).find('.limit .status').text().trim() || null;
        const episodeInfo = $(element).find('.limit .bt .epx').text().trim() || null;

        if (title && movieUrl) {
          movies.push({
            title,
            url: movieUrl,
            image: imageUrl,
            status,
            episode_info: episodeInfo,
          });
        }
      });

      if (movies.length === 0) break;

      allMovies.push(...movies);
      page++;
    }

    return allMovies;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function searchDonghub(query) {
  const formattedQuery = query.replace(/ /g, '+');
  const searchUrl = `https://donghub.vip/?s=${formattedQuery}`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const searchResults = [];

    $('.listupd .bs').each((index, element) => {
      const title = $(element).find('.tt h2').text().trim();
      const url = $(element).find('.bsx > a').attr('href');
      const image = $(element).find('.limit img').attr('src');
      const type = $(element).find('.limit .typez').text().trim() || 'N/A';
      const episodeInfo = $(element).find('.limit .bt .epx').text().trim();

      if (title && url) {
        searchResults.push({
          title,
          url,
          image,
          type,
          episode_info: episodeInfo,
        });
      }
    });

    return searchResults;
  } catch (error) {
    throw new Error(error.message);
  }
}

export default {
  name: "Donghub Anime/Donghua",
  desc: "Scraping Anime & Donghua from Donghub",
  category: "Anime",
  path: "/anime/donghub?apikey=&query=",
  async run(req, res) {
    const { apikey, query } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.json({ status: false, error: "Apikey invalid" });
    }

    try {
      if (query) {
        const result = await searchDonghub(query);
        return res.json({ status: true, query, result });
      } else {
        const result = await scrapeDonghubAllMovies();
        return res.json({ status: true, result });
      }
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message });
    }
  }
};