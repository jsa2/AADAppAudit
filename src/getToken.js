
const fs = require('fs')
const { decode } = require("jsonwebtoken")
var path = require('path')
const { runner } = require('./pluginRunner')


async function getToken() {

    try {

        const token = require('sessionToken.json')
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

        try {

            let token = await runner('az account get-access-token --resource=https://graph.microsoft.com --query accessToken --output json')
            fs.writeFileSync( 'sessionToken.json',JSON.stringify(token))
            return token
        } catch(error) {
            throw new Error(`token expired: ${JSON.stringify(error)}`)
        } 

    }


}

module.exports=getToken