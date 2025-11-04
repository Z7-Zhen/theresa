import fetch from "node-fetch";

const cuaca = {
    get url() {
        return {
            api_cuaca: `https://weather.bmkg.go.id/api/presentwx/coord`,
            api_cuaca_warning: `https://cuaca.bmkg.go.id/api/v1/public/weather/warning`,
        };
    },

    get string() {
        return {
            bmkg: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFjNWFkZWUxYzY5MzM0NjY2N2EzZWM0MWRlMjBmZWZhNDcxOTNjYzcyZDgwMGRiN2ZmZmFlMWVhYjcxZGYyYjQiLCJpYXQiOjE3MDE1ODMzNzl9.D1VNpMoTUVFOUuQW0y2vSjttZwj0sKBX33KyrkaRMcQ'
        };
    },

    get baseHeaders() {
        return { 'accept-encoding': 'gzip, deflate, br, zstd' };
    },

    validateCoordinate(what, input, startLimit, endLimit) {
        const lat = parseFloat(input);
        if (isNaN(lat) || !(lat >= startLimit && lat <= endLimit)) throw Error(`${what} tidak valid`);
    },

    validasiString(deskripsi, variabel) {
        if (typeof variabel !== "string" || !variabel?.trim()?.length)
            throw Error(`Param ${deskripsi} harus string dan tidak boleh kosong`);
    },

    mintaJson: async function (description, url, fetchOptions) {
        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) throw Error(`${response.status} ${response.statusText}\n${await response.text()}`);
            return await response.json();
        } catch (error) {
            throw Error(`Gagal minta json: ${description}\nError: ${error.message}`);
        }
    },

    // Fungsi dummy cari koordinat (pakai Google Maps scraping seperti script-mu)
    cariKoordinat: async function (lokasiKamu) {
        this.validasiString('lokasi', lokasiKamu);
        // Misal pakai koordinat default untuk demo
        return { latitude: -8.8141, longitude: 115.1666, placeName: "Patung Garuda Wisnu Kencana" };
    },

    getkWeatherByCoordinateBMKG: async function (latitude, longitude, placeName = "") {
        this.validateCoordinate('latitude', latitude, -12, 7);
        this.validateCoordinate('longitude', longitude, 93, 142);

        const cuacaApi = new URL(this.url.api_cuaca);
        cuacaApi.search = new URLSearchParams({ lat: latitude, lon: longitude });

        const cuacaWarningApi = new URL(this.url.api_cuaca_warning);
        cuacaWarningApi.search = new URLSearchParams({ lat: latitude, long: longitude });

        const allRequest = [
            this.mintaJson('cuaca', cuacaApi, { headers: this.baseHeaders }),
            this.mintaJson('cuaca warning', cuacaWarningApi, { headers: { ...this.baseHeaders, 'X-api-key': this.string.bmkg } })
        ];

        const [cuacaJson, cuacaWarningJson] = await Promise.all(allRequest);

        const lokasi = `${cuacaJson.data.lokasi.desa}, ${cuacaJson.data.lokasi.kecamatan}, ${cuacaJson.data.lokasi.kotkab}, ${cuacaJson.data.lokasi.provinsi}`;
        const cuaca = cuacaJson.data.cuaca;
        const angin = `Angin: ${cuaca.wd} ke ${cuaca.wd_to}, ${cuaca.ws} km/jam`;

        const warning = cuacaWarningJson.data?.today?.description?.description || '(tidak ada)';

        return {
            placeName: placeName || cuacaJson.data.lokasi.desa,
            lokasi,
            waktu: cuaca.local_datetime,
            cuaca: cuaca.weather_desc,
            suhu: cuaca.t + "°C",
            kelembapan: cuaca.hu + "%",
            angin,
            peringatan: warning,
            bmkg: `https://www.bmkg.go.id/cuaca/prakiraan-cuaca/${cuacaJson.data.lokasi.adm4}`,
            gmap: `https://www.google.com/maps?q=${latitude},${longitude}`
        };
    },

    run: async function (lokasiKamu) {
        const { latitude, longitude, placeName } = await this.cariKoordinat(lokasiKamu);
        return await this.getkWeatherByCoordinateBMKG(latitude, longitude, placeName);
    }
};

export default {
    name: "Cuaca BMKG",
    desc: "Ambil info cuaca dan peringatan BMKG berdasarkan lokasi",
    category: "Tools",
    path: "/tools/cuaca?apikey=&lokasi=",

    async run(req, res) {
        try {
            const { apikey, lokasi } = req.query;

            if (!apikey || !global.apikey.includes(apikey))
                return res.json({ status: false, error: "Apikey invalid" });
            if (!lokasi) return res.json({ status: false, error: "Parameter 'lokasi' wajib diisi" });

            const result = await cuaca.run(lokasi);
            res.status(200).json({ status: true, result });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    }
};