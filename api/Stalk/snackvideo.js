import axios from "axios";
import * as cheerio from "cheerio";

function getStatCount(statArray, actionType) {
  if (!Array.isArray(statArray)) return 0;
  const stat = statArray.find((s) =>
    s.interactionType["@type"].includes(actionType)
  );
  return stat ? stat.userInteractionCount : 0;
}

function parseProfile($) {
  const profileScriptTag = $("#Person").html();
  if (!profileScriptTag) return {};
  const jsonData = JSON.parse(profileScriptTag);
  const profile = jsonData.mainEntity;
  return {
    nama: profile.name,
    id: profile.alternateName,
    deskripsi: profile.description,
    foto_profil: profile.image,
    followers: getStatCount(profile.interactionStatistic, "FollowAction"),
    total_like: getStatCount(profile.interactionStatistic, "LikeAction"),
    total_video: profile.agentInteractionStatistic?.userInteractionCount || 0,
  };
}

function parseVideos($) {
  const videoScriptTag = $("#ItemList").html();
  if (!videoScriptTag) return [];
  const jsonData = JSON.parse(videoScriptTag);
  const videos = jsonData.itemListElement.slice(0, 3);
  return videos.map((v) => ({
    judul_video: v.name,
    deskripsi: v.description,
    url_halaman: v.url,
    url_file_video: v.contentUrl,
    thumbnail: v.thumbnailUrl?.[0] || null,
    tanggal_upload: v.uploadDate,
    views: getStatCount(v.interactionStatistic, "WatchAction"),
    likes: getStatCount(v.interactionStatistic, "LikeAction"),
    shares: getStatCount(v.interactionStatistic, "ShareAction"),
  }));
}

async function stalkSnackVideo(username) {
  const url = `https://www.snackvideo.com/@${username}?page_source=new_discover`;
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(html);
    return {
      profile: parseProfile($),
      videos: parseVideos($),
    };
  } catch (err) {
    return { profile: {}, videos: [], error: err.message };
  }
}

export default {
  name: "SnackVideo",
  desc: "Stalker profil dan video terbaru pengguna",
  category: "Stalker",
  path: "/stalk/snackvideo?apikey=&username=",
  async run(req, res) {
    try {
      const { apikey, username } = req.query;

      if (!apikey || !global.apikey?.includes(apikey)) {
        return res.json({ status: false, error: "Apikey invalid" });
      }

      if (!username) {
        return res.json({ status: false, error: "Parameter 'username' wajib diisi" });
      }

      const result = await stalkSnackVideo(username);

      if (result.error) {
        return res.status(500).json({ status: false, error: result.error });
      }

      res.status(200).json({
        status: true,
        creator: "Z7:林企业",
        result,
      });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  },
};
