 const axios = require('axios');
const cheerio = require('cheerio');

async function WallpaperFlare(query) {
    try {
        const response = await axios.get(`https://www.wallpaperflare.com/search?wallpaper=${encodeURIComponent(query)}`);
        const html = response.data;
        
        const $ = cheerio.load(html);
        
        const wallpapers = [];
        
        $('li[itemprop="associatedMedia"]').each((index, element) => {
            const $element = $(element);
            
            const resolution = $element.find('.res').text().trim();
            const fileSize = $element.find('meta[itemprop="contentSize"]').attr('content');
            const format = $element.find('meta[itemprop="fileFormat"]').attr('content');
            const caption = $element.find('figcaption').text().trim();
            const imageUrl = $element.find('img.lazy').attr('data-src');
            
            if (imageUrl) {
                wallpapers.push({
                    resolution,
                    fileSize,
                    format,
                    caption,
                    imageUrl
                });
            }
        });
        
        return wallpapers;
        
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

// Contoh penggunaan
(async () => {
    const result = await WallpaperFlare('Naruto');
    console.log(JSON.stringify(result, null, 2));
})();
