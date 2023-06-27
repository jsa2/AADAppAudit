

const fs = require('fs')
const { decode } = require("jsonwebtoken")

async function getARMToken() {

    try {

        const token = require('ARMsessionToken.json')
        const decoded = decode(token)
        const now = Date.now().valueOf() / 1000
        //https://stackoverflow.com/a/55706292 (not using full verification, as the token is not meant to be validated in this tool, but in Azure API)
        if (typeof decoded.exp !== 'undefined' && decoded.exp < now) {
            throw new Error(`token expired: ${JSON.stringify(decoded)}`)
        }
        if (typeof decoded.nbf !== 'undefined' && decoded.nbf > now) {
            throw new Error(`token expired: ${JSON.stringify(decoded)}`)
        }

        return token

    } catch (error) {
        var token = await require('./pluginRunner').runner('az account get-access-token --resource=https://management.azure.com --query accessToken --output json')
        fs.writeFileSync( 'ARMsessionToken.json',JSON.stringify(token))
        return token || error

    }


}

module.exports={getARMToken}
