const axios = require("axios");
const dayjs = require("dayjs");

const jobStreet = {
  base: "https://jobsearch-api.cloud.seek.com.au",

  headers: {
    "user-agent": "Mozilla/5.0 (Linux; Android 10)",
    "accept-language": "id,en;q=0.9",
  },

  /**
   * 🔹 Ambil daftar lowongan kerja
   */
  check: async (pekerjaan, kota, jumlah = 10) => {
    if (!pekerjaan || !kota) {
      return {
        status: false,
        creator: "Z7:林企业",
        error: "Parameter 'pekerjaan' dan 'kota' wajib diisi",
        example: "/info/loker?pekerjaan=barista&kota=Bandung&jumlah=5",
      };
    }

    try {
      const params = {
        keywords: pekerjaan,
        where: kota,
        sitekey: "ID",
        sourcesystem: "houston",
        pageSize: jumlah,
        page: 1,
        locale: "id-ID",
      };

      const { data } = await axios.get(`${jobStreet.base}/v5/search`, {
        params,
        headers: jobStreet.headers,
        timeout: 10000,
      });

      const jobs = data.data || [];
      if (!jobs.length) {
        return {
          status: false,
          creator: "Z7:林企业",
          error: "Tidak ada lowongan ditemukan",
        };
      }

      const results = jobs.map((job) => ({
        title: job.title || "-",
        company: job.companyName || "-",
        location: job.locations?.[0]?.label || "-",
        date: job.listingDate
          ? dayjs(job.listingDate).format("DD MMM YYYY")
          : "-",
        salary: job.salaryLabel || "Tidak dicantumkan",
        description: job.teaser || "-",
        logo: job.branding?.serpLogoUrl || "",
        link: `https://id.jobstreet.com/job/${job.id}`,
      }));

      return {
        status: true,
        creator: "Z7:林企业",
        result: {
          query: { pekerjaan, kota, jumlah },
          total: results.length,
          jobs: results,
        },
      };
    } catch (err) {
      return {
        status: false,
        creator: "Z7:林企业",
        error: err.message,
      };
    }
  },
};

/**
 * 🔹 Route Handler untuk /info/loker
 */
module.exports = function (app) {
  app.get("/search/loker", async (req, res) => {
    const { pekerjaan, kota, jumlah } = req.query;

    try {
      const result = await jobStreet.check(pekerjaan, kota, jumlah ? parseInt(jumlah) : 5);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        status: false,
        creator: "Z7:林企业",
        error: error.message,
      });
    }
  });
};