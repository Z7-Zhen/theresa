import fetch from "node-fetch";

const fiturRequest = {
    webhookUrl: "https://discord.com/api/webhooks/1435296124570304562/UEmr7oqM1kCi1d5YwHCvlGGtj3USXI7WFFaNuFb-oqEQD97Bzq-TL0CoUqoR1CRzTEuc", // Ganti dengan webhook-mu
    roleId: "ROLE_ID", // opsional: mention role tertentu

    validasiString(deskripsi, variabel) {
        if (typeof variabel !== "string" || !variabel?.trim()?.length)
            throw Error(`Param ${deskripsi} harus string dan tidak boleh kosong`);
    },

    kirimKeDiscord: async function(user, fitur) {
        const payload = {
            embeds: [
                {
                    title: "🆕 Request Fitur Baru",
                    description: fitur,
                    color: 0x00ff00, // hijau
                    timestamp: new Date(),
                    fields: [
                        { name: "User", value: user, inline: true },
                        { name: "Fitur", value: fitur, inline: false }
                    ]
                }
            ],
            content: this.roleId ? `<@&${this.roleId}>` : null
        };

        const res = await fetch(this.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Gagal kirim ke Discord: ${res.status} ${res.statusText}`);
        return true;
    },

    run: async function(user, fitur) {
        this.validasiString("user", user);
        this.validasiString("fitur", fitur);
        return await this.kirimKeDiscord(user, fitur);
    }
};

export default {
    name: "Request Fitur",
    desc: "Kirim ide/fitur baru ke Discord webhook dengan embed",
    category: "Tools",
    path: "/tools/request?apikey=&user=&fitur=",

    async run(req, res) {
        try {
            const { apikey, user, fitur } = req.query;

            if (!apikey || !global.apikey.includes(apikey))
                return res.json({ status: false, error: "Apikey invalid" });
            if (!user || !fitur)
                return res.json({ status: false, error: "Parameter 'user' dan 'fitur' wajib diisi" });

            await fiturRequest.run(user, fitur);
            res.status(200).json({ status: true, message: "Request fitur berhasil dikirim ke Discord (embed)!" });
        } catch (e) {
            res.status(500).json({ status: false, error: e.message });
        }
    }
};