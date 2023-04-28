
const { createContainerV2, uploadV2, getSasUrlV2 } = require('./src/storagev2')


async function createStorage (container,file, filePath) {

    await createContainerV2(container).catch(error => {
        console.log( error )
        throw new Error('Unable to work with storage',error)
    })


    await uploadV2(container, file, filePath)

    //120 is 120 hours, change the value to desired amount
    var url = getSasUrlV2(container, file, 10)
    
    return url

}


module.exports={createStorage}
