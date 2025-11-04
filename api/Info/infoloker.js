import axios from "axios";
import dayjs from "dayjs";

/**
 * Cari lowongan kerja via JobStreet API
 * @param {string} pekerjaan - kata kunci pekerjaan
 * @param {string} kota - lokasi/kota
 * @param {number} jumlah - jumlah hasil
 * @returns {Promise<Array>} daftar lowongan kerja
 */
async function cariLoker(pekerjaan, kota, jumlah = 10) {
  const url = "https://jobsearch-api.cloud.seek.com.au/v5/search";
  const params = {
    keywords: pekerjaan,
    where: kota,
    sitekey: "ID",
    sourcesystem: "houston",
    pageSize: jumlah,
    page: 1,
    locale: "id-ID",
  };

  const res = await axios.get(url, { params });
  const jobs = res.data.data || [];

  if (jobs.length === 0) throw new Error("Tidak ada lowongan ditemukan.");

  return jobs.map((job) => ({
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
}

export default {
  name: "JobStreet Loker Finder",
  desc: "Cari lowongan pekerjaan berdasarkan kata kunci dan kota",
  category: "Info",
  path: "/info/loker?apikey=&pekerjaan=&kota=&jumlah=",

  /**
   * Route handler
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async run(req, res) {
    const { apikey, pekerjaan, kota, jumlah } = req.query;

    // Validasi apikey
    if (!apikey || !global.apikey.includes(apikey))
      return res.json({ status: false, error: "Apikey invalid" });

    // Validasi input
    if (!pekerjaan || !kota)
      return res.json({
        status: false,
        error: "Parameter 'pekerjaan' dan 'kota' wajib diisi",
        example: "/Info/loker?apikey=YOURKEY&pekerjaan=barista&kota=Bandung&jumlah=5",
      });

    try {
      const data = await cariLoker(pekerjaan, kota, jumlah ? parseInt(jumlah) : 5);
      res.status(200).json({
        status: true,
        info: {
          query: { pekerjaan, kota, jumlah: jumlah || 5 },
          total: data.length,
        },
        result: data,
      });
    } catch (err) {
      res.status(500).json({ status: false, error: err.message });
    }
  },
};