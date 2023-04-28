

const {resolve } = require('dns').promises;



async function getWebSitesName (object) {
var {fqdn,id} = object
    try { 
        await resolve(fqdn)
        return {fqdn}
} catch (error) {
  
    return {fqdn,failed:true}
}
   

}

module.exports={getWebSitesName}