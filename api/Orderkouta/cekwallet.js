import axios from "axios";
import qs from "qs";

/**
 * Cek e-wallet berdasarkan provider dan nomor
 * @param {string} provider - contoh: 'dana', 'ovo', 'gopay', 'shopeepay', 'linkaja'
 * @param {string} nomor - nomor e-wallet
 */
export async function cekEwallet(provider, nomor) {
  const validProviders = ["dana", "ovo", "gopay", "shopeepay", "linkaja"];
  if (!validProviders.includes(provider)) {
    return {
      status: false,
      error: "Provider tidak valid",
      valid_providers: validProviders,
    };
  }

  try {
    const timestamp = Date.now().toString();

    const data = qs.stringify({
      app_reg_id:
        "cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw",
      phone_uuid: "cdzXkBynRECkAODZEHwkeV",
      phone_model: "23124RA7EO",
      phoneNumber: nomor,
      request_time: timestamp,
      phone_android_version: "15",
      app_version_code: "250918",
      auth_username: "sumarjono",
      customerId: "",
      id: provider,
      auth_token: "2604338:tMbsgZKq2JYxOG8BvTQnfm1oup0XaNPI",
      app_version_name: "25.09.18",
      ui_mode: "dark",
    });

    const config = {
      method: "POST",
      url: `https://checker.orderkuota.com/api/checkname/produk/981e2121cf08cc5b0961abe71ccb0725211a3e8a54/22/2604338/${provider}?phone=${nomor}&cust_id=`,
      headers: {
        "User-Agent": "okhttp/4.12.0",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/x-www-form-urlencoded",
        signature:
          "63c7cce025a219cf50ad08513d2a669e1c7bacf3233e42810aa42ced97eca2e6c6a926afd5afd93eb2fd90854e045d12921a2c84049f8096f4ec2b849097e940",
        timestamp,
      },
      data,
    };

    const response = await axios.request(config);
    return { status: true, result: response.data };
  } catch (err) {
    return { status: false, error: err.message };
  }
}

// ROUTE EXPORT
export default [
  {
    name: "Cek Ewallet",
    desc: "Cek nama akun Ewallet",
    category: "Orderkuota",
    path: "/orderkuota/cekewallet?apikey=&provider=&nomor=",
    async run(req, res) {
      const { apikey, provider, nomor } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!provider)
        return res.json({ status: false, error: "Missing provider" });
      if (!nomor) return res.json({ status: false, error: "Missing nomor" });

      try {
        const result = await cekEwallet(provider.toLowerCase(), nomor);
        res.json(result);
      } catch (error) {
        res
          .status(500)
          .json({ status: false, error: error.message || "Server error" });
      }
    },
  },
];