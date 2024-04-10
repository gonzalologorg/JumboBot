const fs = require('fs');
const { pipeline } = require("stream/promises")
const https = require("https")

async function download(url, target) {
    return new Promise(async (onSuccess) => {
        https.get(url, async (res) => {
            const fileWriteStream = fs.createWriteStream(target, {
                autoClose: true,
                flags: "w",
            })
            await pipeline(res, fileWriteStream)
            onSuccess("success")
        })
    })
}

module.exports = download