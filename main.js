const { decode } = require("jsonwebtoken");

const getToken = require("./src/getToken");
const fs = require('fs');
const { exec } = require("child_process");
const { preCheck } = require("./precheck");
const { admins } = require("./admins");
const { mainV2 } = require("./mainV2");
const wexc = require('util').promisify(exec)

run().catch((error) => {
    return error
})

async function run() {

    let accountName
    if (process.argv && process.argv[2]) {
        accountName = process.argv[2]
    }


    await preCheck(accountName)

    var token = await getToken()

    var tEnc = decode(token)
    fs.writeFileSync('kql/tid.txt', tEnc.tid)

    await mainV2({
        access_token: token,
        resource: "https://graph.microsoft.com"
    })

    await admins()

    try {
        await wexc('node nodeparse2.js')
        //await wexc('node dynamicSend.js')
        console.log('creating query')
        await wexc(`node schemaForExternalData.js ${accountName}`)
        console.log('open kql/runtime.kql')
    } catch (error) {
        console.log('faield', error)
        fs.unlinkSync('sessionToken.json')
    }

    fs.unlinkSync('sessionToken.json')


}