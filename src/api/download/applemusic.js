const axios = require("axios");

const cookieString =
  "_ga=GA1.1.206983766.1756790346; PHPSESSID=jomn6brkleb5969a3opposidru; quality=m4a; dcount=2; _ga_382FSD5=GS2.1.s1756858170$o3$g1$t1756858172$j58$l0$h0";

const axiosInstance = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Cookie: cookieString,
  },
});

function encodeDownloadUrl(url) {
  return url ? url.replace(/ /g, "%20") : url;
}

function detectUrlType(url) {
  if (!url) return null;
  if (url.includes("/song/")) return "song";
  if (url.includes("/album/") && url.includes("?i=")) return "song";
  if (url.includes("/album/") && !url.includes("?i=")) return "album";
  return "song";
}

async function fetchAppleMusic(url) {
  if (!url) throw new Error("URL tidak boleh kosong.");
  const type = detectUrlType(url);
  if (!type) throw new Error("URL tidak valid atau tidak dikenali.");
  return type === "album" ? downloadAlbum(url) : downloadSong(url);
}

async function downloadSong(url) {
  try {
    await axiosInstance.get("https://aaplmusicdownloader.com/ifCaptcha.php");
    const endpoint = url.includes("/song/")
      ? "https://aaplmusicdownloader.com/api/song_url.php"
      : "https://aaplmusicdownloader.com/api/applesearch.php";

    const searchResponse = await axiosInstance.get(
      `${endpoint}?url=${encodeURIComponent(url)}`,
      {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://aaplmusicdownloader.com/",
        },
      }
    );

    const searchData = searchResponse.data || {};
    if (!searchData.name) throw new Error("Data lagu tidak ditemukan.");

    await axiosInstance.get("https://aaplmusicdownloader.com/song.php", {
      headers: { Referer: "https://aaplmusicdownloader.com/" },
    });

    const formData = `song_name=${encodeURIComponent(
      searchData.name
    )}&artist_name=${encodeURIComponent(
      searchData.artist || "Unknown Artist"
    )}&url=${encodeURIComponent(url)}&token=none&zip_download=false&quality=m4a`;

    const downloadResponse = await axiosInstance.post(
      "https://aaplmusicdownloader.com/api/composer/swd.php",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://aaplmusicdownloader.com/song.php",
        },
      }
    );

    const downloadData = downloadResponse.data || {};

    return {
      name: searchData.name,
      album_name: searchData.albumname || null,
      type: "song",
      artist: searchData.artist || null,
      thumbnail: searchData.thumb || null,
      duration: searchData.duration || null,
      url: encodeDownloadUrl(downloadData.dlink || downloadData.wmcode),
    };
  } catch (err) {
    throw new Error(`Gagal download lagu: ${err.message}`);
  }
}

async function downloadAlbum(url) {
  try {
    await axiosInstance.get("https://aaplmusicdownloader.com/ifCaptcha.php");

    const playlistResponse = await axiosInstance.get(
      `https://aaplmusicdownloader.com/api/pl.php?url=${encodeURIComponent(
        url
      )}`,
      {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://aaplmusicdownloader.com/",
        },
      }
    );

    const albumData = playlistResponse.data?.album_details || [];
    if (!albumData.length) throw new Error("Album tidak ditemukan.");

    const firstSong = albumData[0];

    const formData = `song_name=${encodeURIComponent(
      firstSong.name
    )}&artist_name=${encodeURIComponent(
      (firstSong.artist || "").replace(/&amp;/g, "&")
    )}&url=${encodeURIComponent(firstSong.link)}&token=na&zip_download=false&quality=m4a`;

    const downloadResponse = await axiosInstance.post(
      "https://aaplmusicdownloader.com/api/composer/swd.php",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          Referer: "https://aaplmusicdownloader.com/album.php",
        },
      }
    );

    const result = downloadResponse.data || {};

    return {
      name: firstSong.name,
      album_name: firstSong.album || null,
      type: "album",
      artist: (firstSong.artist || "").replace(/&amp;/g, "&"),
      thumbnail: firstSong.thumb || null,
      duration: firstSong.duration || null,
      url: encodeDownloadUrl(result.dlink || result.wmcode),
    };
  } catch (err) {
    throw new Error(`Gagal download album: ${err.message}`);
  }
}

module.exports = function (app) {
  app.get("/download/applemusic", async (req, res) => {
    try {
      const { url } = req.query;

      if (!url)
        return res
          .status(400)
          .json({ status: false, error: "Parameter 'url' diperlukan" });

      const result = await fetchAppleMusic(url);

      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  });
};