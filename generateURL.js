
const fs = require('fs')
const beautify = require('js-beautify').js

try {
    fs.unlinkSync('list.md')
} catch (err) { }

require('./material/servicePrincipalsUP.json').filter(s => s?.danglingRedirect?.length > 0 && s?.appType !== "ms").map(s => {

let p = `## ${s?.appDisplayName} `



s.replyUrls.forEach(r => {

p += `

**${r}**

\`\`\`

https://login.microsoftonline.com/common/oauth2/authorize?client_id=${s.appId}&redirect_uri=${r}&resource=${s.appId}&response_mode=query&response_type=code


https://login.microsoftonline.com/common/oauth2/authorize?client_id=${s.appId}&redirect_uri=${r}&resource=${s.appId}&response_mode=query&response_type=code&code_challenge_method=S256&code_challenge=8-NINIrn6AA_FcoylZuf9GtB5-lRhSri5MGf-TVYWQc

https://login.microsoftonline.com/common/oauth2/authorize?client_id=${s.appId}
&redirect_uri=${r}
&resource=${s.appId}
&response_mode=query

\`\`\`



`



    })



p += `

\`\`\`json

${beautify(JSON.stringify(s))}

\`\`\`

`

fs.appendFileSync('list.md', p)
    
})




//console.log(data)