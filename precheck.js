
const getToken = require('./src/getToken')
const { createContainerV2 } = require('./src/storagev2')

async function preCheck () {

    console.log('testing access tokens')

    await getToken()

    console.log('Az access ok')

    console.log('testing storage')
   var s =await createContainerV2('sdasdasdsarewrewrewre').catch(error => {
        console.log( error )
        return Promise.reject(`Unable to work with storage ${error}` )
    })

    console.log('storage access ok',s)

}


module.exports={preCheck}