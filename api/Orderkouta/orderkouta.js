import crypto from "crypto";
import QRCode from "qrcode";
import { ImageUploadService } from "node-upload-images";
import { URLSearchParams } from "url";

const fetch = global.fetch;

// 🧩 CLASS OrderKuota
export class OrderKuota {
  static API_URL = "https://app.orderkuota.com/api/v2";
  static API_URL_ORDER = "https://app.orderkuota.com/api/v2/order";
  static HOST = "app.orderkuota.com";
  static USER_AGENT = "okhttp/4.12.0";
  static APP_VERSION_NAME = "25.09.18";
  static APP_VERSION_CODE = "250918";
  static APP_REG_ID =
    "cdzXkBynRECkAODZEHwkeV:APA91bHRyLlgNSlpVrC4Yv3xBgRRaePSaCYruHnNwrEK8_pX3kzitxzi0CxIDFc2oztCwcw7-zPgwE-6v_-rJCJdTX8qE_ADiSnWHNeZ5O7_BIlgS_1N8tw";
  static PHONE_MODEL = "SM-G960N";
  static PHONE_UUID = "cdzXkBynRECkAODZEHwkeV";
  static PHONE_ANDROID_VERSION = "9";

  constructor(username = null, authToken = null) {
    this.username = username;
    this.authToken = authToken;
  }

  async loginRequest(username, password) {
    const payload = new URLSearchParams({
      username,
      password,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
    });
    return await this.request("POST", `${OrderKuota.API_URL}/login`, payload);
  }

  async getAuthToken(username, otp) {
    const payload = new URLSearchParams({
      username,
      password: otp,
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
    });
    return await this.request("POST", `${OrderKuota.API_URL}/login`, payload);
  }

  // 🔄 Mutasi QRIS
  async getTransactionQris(type = "", userId = null) {
    if (!userId && this.authToken) {
      userId = this.authToken.split(":")[0];
    }

    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      "requests[qris_history][jumlah]": "",
      "requests[qris_history][jenis]": type,
      "requests[qris_history][page]": "1",
      "requests[qris_history][dari_tanggal]": "",
      "requests[qris_history][ke_tanggal]": "",
      "requests[qris_history][keterangan]": "",
      "requests[0]": "account",
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: "light",
      phone_model: OrderKuota.PHONE_MODEL,
    });

    const endpoint = userId
      ? `${OrderKuota.API_URL}/qris/mutasi/${userId}`
      : `${OrderKuota.API_URL}/get`;

    return await this.request("POST", endpoint, payload);
  }

  // 🧾 Generate QRIS
  async generateQr(amount = "") {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      "requests[qris_merchant_terms][jumlah]": amount,
      "requests[0]": "qris_merchant_terms",
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: "light",
      phone_model: OrderKuota.PHONE_MODEL,
    });

    const response = await this.request("POST", `${OrderKuota.API_URL}/get`, payload);
    try {
      if (response.success && response.qris_merchant_terms?.results) {
        return response.qris_merchant_terms.results;
      }
      return response;
    } catch (err) {
      return { error: err.message, raw: response };
    }
  }

  // 💸 Withdraw QRIS
  async withdrawalQris(amount = "") {
    const payload = new URLSearchParams({
      request_time: Date.now(),
      app_reg_id: OrderKuota.APP_REG_ID,
      phone_android_version: OrderKuota.PHONE_ANDROID_VERSION,
      app_version_code: OrderKuota.APP_VERSION_CODE,
      phone_uuid: OrderKuota.PHONE_UUID,
      auth_username: this.username,
      auth_token: this.authToken,
      "requests[qris_withdraw][amount]": amount,
      "requests[0]": "account",
      app_version_name: OrderKuota.APP_VERSION_NAME,
      ui_mode: "light",
      phone_model: OrderKuota.PHONE_MODEL,
    });

    return await this.request("POST", `${OrderKuota.API_URL}/get`, payload);
  }

  buildHeaders() {
    return {
      Host: OrderKuota.HOST,
      "User-Agent": OrderKuota.USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      "accept-encoding": "gzip",
    };
  }

  async request(method, url, body = null) {
    try {
      const res = await fetch(url, {
        method,
        headers: this.buildHeaders(),
        body: body ? body.toString() : null,
      });

      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) return await res.json();
      return await res.text();
    } catch (err) {
      return { error: err.message };
    }
  }
}

// 🧮 Helper Functions
function convertCRC16(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ("000" + (crc & 0xffff).toString(16).toUpperCase()).slice(-4);
}

function generateTransactionId() {
  return `Z7:PEDIA-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function generateExpirationTime() {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30);
  return expirationTime;
}

async function elxyzFile(buffer) {
  const service = new ImageUploadService("pixhost.to");
  const { directLink } = await service.uploadFromBinary(buffer, "Z7.png");
  return directLink;
}

export async function createQRIS(amount, codeqr) {
  let qrisData = codeqr.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const [prefix, suffix] = step1.split("5802ID");
  const uang = "54" + ("0" + amount.length).slice(-2) + amount + "5802ID";
  const final = prefix + uang + suffix;
  const result = final + convertCRC16(final);
  const buffer = await QRCode.toBuffer(result);
  const uploadedFile = await elxyzFile(buffer);

  return {
    idtransaksi: generateTransactionId(),
    jumlah: amount,
    expired: generateExpirationTime(),
    imageqris: { url: uploadedFile },
  };
}

// 🌐 ROUTE EXPORT
export default [
  {
    name: "Get OTP (tahap 1)",
    desc: "Get OTP Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/getotp?apikey=&username=&password=",
    async run(req, res) {
      const { apikey, username, password } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!username)
        return res.json({ status: false, error: "Missing username" });
      if (!password)
        return res.json({ status: false, error: "Missing password" });

      try {
        const ok = new OrderKuota();
        const login = await ok.loginRequest(username, password);
        res.json({ status: true, result: login.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
  {
    name: "Get Token (tahap 2)",
    desc: "Get Token Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/gettoken?apikey=&username=&otp=",
    async run(req, res) {
      const { apikey, username, otp } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!username)
        return res.json({ status: false, error: "Missing username" });
      if (!otp) return res.json({ status: false, error: "Missing otp" });

      try {
        const ok = new OrderKuota();
        const login = await ok.getAuthToken(username, otp);
        res.json({ status: true, result: login.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
  {
    name: "Cek Mutasi QRIS",
    desc: "Cek Mutasi Qris Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/mutasiqr?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!username)
        return res.json({ status: false, error: "Missing username" });
      if (!token) return res.json({ status: false, error: "Missing token" });

      try {
        const ok = new OrderKuota(username, token);
        const login = await ok.getTransactionQris();
        res.json({ status: true, result: login.qris_history.results });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
  {
    name: "Cek Profile",
    desc: "Cek Profile Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/profile?apikey=&username=&token=",
    async run(req, res) {
      const { apikey, username, token } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!username)
        return res.json({ status: false, error: "Missing username" });
      if (!token) return res.json({ status: false, error: "Missing token" });

      try {
        const ok = new OrderKuota(username, token);
        const profile = await ok.getTransactionQris();
        res.json({ status: true, result: profile });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    },
  },
  {
    name: "Create QRIS",
    desc: "Generate QR Code Payment",
    category: "Orderkuota",
    path: "/orderkuota/createpayment?apikey=&username=&token=&amount=",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!username)
        return res.json({ status: false, error: "Missing username" });
      if (!token) return res.json({ status: false, error: "Missing token" });
      if (!amount) return res.json({ status: false, error: "Missing amount" });

      try {
        const ok = new OrderKuota(username, token);
        const qrcodeResp = await ok.generateQr(amount);

        if (!qrcodeResp.qris_data) {
          return res
            .status(400)
            .json({ status: false, error: "QRIS generation failed", raw: qrcodeResp });
        }

        const buffer = await createQRIS(amount, qrcodeResp.qris_data);
        res.status(200).json({ status: true, result: buffer });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
  {
    name: "Withdraw QRIS",
    desc: "Tarik saldo QRIS Orderkuota",
    category: "Orderkuota",
    path: "/orderkuota/wdqr?apikey=&username=&token=&amount=",
    async run(req, res) {
      const { apikey, username, token, amount } = req.query;
      if (!global.apikey.includes(apikey))
        return res.json({ status: false, error: "Apikey invalid" });
      if (!username)
        return res.json({ status: false, error: "Missing username" });
      if (!token) return res.json({ status: false, error: "Missing token" });
      if (!amount) return res.json({ status: false, error: "Missing amount" });

      try {
        const ok = new OrderKuota(username, token);
        const wd = await ok.withdrawalQris(amount);
        res.json({ status: true, result: wd });
      } catch (error) {
        res.status(500).json({ status: false, error: error.message });
      }
    },
  },
];