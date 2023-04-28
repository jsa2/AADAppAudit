const {exec} =require('child_process')

const wexc = require('util').promisify(exec)
var path = require('path')
const bfr = {maxBuffer: 1024 * 1024}

// Control with NodeSchema

    async function runner (script) {

            try { 
                var {stdout,stderr} = await wexc(script, bfr) 
                results = JSON.parse(stdout)
                //console.log(results)
                return results
            }
            catch(error) {
                console.log(error)
                throw new Error(`token expired: ${JSON.stringify(error)}`)
                return `Failed to process ${script}, due to ${JSON.stringify(error)}`
            }

        

}

module.exports={runner}


 