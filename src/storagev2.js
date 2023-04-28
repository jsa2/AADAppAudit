

let sta = require('./config.json').connectionString

/* const { BlobUtilities } = require('azure-storage') */



const {
    BlobServiceClient,
    AccountSASPermissions,
    AccountSASServices,
    AccountSASResourceTypes,
    SASProtocol
} = require('@azure/storage-blob');

const blobServiceClient = BlobServiceClient.fromConnectionString(sta)

async function createContainerV2(containerName) {

    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();
    console.log(`Checking container ${containerName} successfully`)


}


async function uploadV2(container, file, filepath) {

    const containerClient = blobServiceClient.getContainerClient(container);

    const blockBlobClient = containerClient.getBlockBlobClient(file);

    let res = await blockBlobClient.uploadFile(filepath)



}


async function getSasUrlV2(container, name, duration, IPAddressOrRange) {

    const containerClient = blobServiceClient.getContainerClient(container);

    let d1 = new Date(),
        d2 = new Date(d1);
    d2.setMinutes(d1.getMinutes() + duration);

    const sasOptions = {

        services: AccountSASServices.parse("b").toString(),          // blobs, tables, queues, files
        resourceTypes: AccountSASResourceTypes.parse("o").toString(), // service, container, object
        permissions: AccountSASPermissions.parse("r"),          // permissions
        protocol: SASProtocol.Https,
        /*   startsOn: new Date(),
          expiresOn: new Date(new Date().valueOf() + (10 * 60 * 1000)),   // 10 minutes */
        startsOn: d1,
        expiresOn: d2
    };

    let url2 = await containerClient.generateSasUrl(sasOptions)

    let url = url2.replace('material',`material/${name}`)
    return (url)


}


//reads()
module.exports = { createContainerV2, uploadV2, getSasUrlV2 }