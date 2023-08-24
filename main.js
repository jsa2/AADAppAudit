const { decode } = require("jsonwebtoken");

const getToken = require("./src/getToken");
const fs = require('fs');
const { exec } = require("child_process");
const { preCheck } = require("./precheck");
const { admins } = require("./admins");
const { mainV2 } = require("./mainV2");
const { argv } = require("yargs");
const wexc = require('util').promisify(exec)



run().catch((error) => {
    return error
})

async function run() {


    let accountName = argv?.sa || (process?.argv[2])
    if (accountName?.match('--')) { accountName = undefined }

    if (accountName) {
        await preCheck(accountName)
    } else {
        console.log('running only CSV output')
    }


    var token = await getToken()

    var tEnc = decode(token)
    fs.writeFileSync('kql/tid.txt', tEnc.tid)

    await mainV2({
        access_token: token,
        resource: "https://graph.microsoft.com"
    })

    await admins()

    try {

        if (argv.checkTrafficManagerAvailability || argv.includeMSresults) {
            await wexc(`node nodeparse2.js ${argv.checkTrafficManagerAvailability !== true || '--checkTrafficManagerAvailability'} ${argv.includeMSresults !== true || '--includeMSresults'}`)
        } else {

            await wexc('node nodeparse2.js')
        }

        //await wexc('node dynamicSend.js')
        console.log('creating query')

        if (accountName) {

            await wexc(`node schemaForExternalData.js --sa=${accountName}`)

            console.log('open kql/runtime.kql')

        } else {
            await wexc(`node toCSV.js --delimitter="${argv?.delimitter || ','}"`)
            console.log('to review the results in csv open the output.csv, remember, that in order to show line breaks, for example in excel you need to select the "wrap text"')
        }



    } catch (error) {
        console.log('failed', error)
        fs.unlinkSync('sessionToken.json')
    }

    fs.unlinkSync('sessionToken.json')


}
