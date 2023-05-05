const { BlobServiceClient,
    BlobSASPermissions,
    generateBlobSASQueryParameters,
    SASProtocol } = require('@azure/storage-blob');

const { DefaultAzureCredential } = require('@azure/identity');
const { argv } = require("yargs");
const accountName = argv?.sa || process?.argv[2]


// Initialize just once the cred as opposed to previous SAS version
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential()
);


async function createContainerV2(accountName, containerName) {

    const containerClient = blobServiceClient.getContainerClient(containerName);
    let teststorage = await containerClient.createIfNotExists();
    /* console.log(teststorage) */
    console.log(`Checking container ${containerName} successfully`)

}


async function uploadV2(accountName, container, file, filepath) {


    const containerClient = blobServiceClient.getContainerClient(container);

    const blockBlobClient = containerClient.getBlockBlobClient(file);

    let res = await blockBlobClient.uploadFile(filepath)

}

async function getSasUrlV2(accountName, container, name, duration, IPAddressOrRange) {

    const containerClient = blobServiceClient.getContainerClient(container);

    let d1 = new Date(),
        d2 = new Date(d1);
    d2.setMinutes(d1.getMinutes() + duration);

    const sasOptions = {
        blobName: name,
        containerName: container,
        permissions: BlobSASPermissions.parse("r"), // Required
        // startsOn: d1, // Optional. Date type
        expiresOn: d2, // Required. Date type
        // ipRange: { start: "0.0.0.0", end: "255.255.255.255" }, // Optional
        protocol: SASProtocol.Https, // Optional
        version: "2021-12-02" // Must greater than or equal to 2018-11-09 to generate user delegation SAS
    };

    const userDelegationKey = await blobServiceClient.getUserDelegationKey(d1, d2);
    const containerSAS = generateBlobSASQueryParameters(sasOptions, userDelegationKey, accountName).toString();

    sasUrl = `${containerClient.getBlockBlobClient(name).url}?${containerSAS.toString()}`;
    return sasUrl


}


//reads()
module.exports = { createContainerV2, uploadV2, getSasUrlV2 }