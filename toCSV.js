const src = require('./material/servicePrincipalsUP.json')
const { argv } = require('yargs')
delim = argv?.delimitter
var top = `app${delim}appID${delim}aadRole${delim}permissions${delim}danglingRedirect${delim}appType${delim}credentials\r\n`
let breakC = 0
src.map(s => {

    breakC++
    const permissions = s?.permissionsReading?.map((d, count, r) => {
        if (r?.length > count + 1) {
            return `${d}\r\n`
        } else {
            return `${d}`
        }
        console.log(count)

    }).join('')

    const danglingRedirect = s?.danglingRedirect?.map((d, count, r) => {
        if (r?.length > count + 1) {
            return `${d?.fqdn}\r\n`
        } else {
            return `${d?.fqdn}`
        }
        console.log(count)

    }).join('')

    const admins = s?.isAdminAADrole?.map((d, count, r) => {
        if (r?.length > count + 1) {
            return `${d}\r\n`
        } else {
            return `${d}`
        }
        console.log(count)

    }).join('')

    const credentials = s?.allCredentials?.map((d, count, r) => {
        if (r?.length > count + 1) {
            return `${d}\r\n`
        } else {
            return `${d}`
        }
        console.log(count)

    }).join('')


    top += `${s?.displayName}${delim}${s?.appId}${delim}"${admins}"${delim}"${permissions}"${delim}"${danglingRedirect}"${delim}${s?.appType}${delim}"${credentials}"`;

    if (breakC !== src?.length) {
        top += '\r';
    } else {
        console.log()
    }



})
require('fs').writeFileSync('output.csv', top)
