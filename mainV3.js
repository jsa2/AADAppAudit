const { graphListMod, graphListModBeta } = require('./src/graphf')
const fs = require('fs')
const { graphBatching } = require('./src/batcher')
const { randomUUID } = require('crypto')
const { argv } = require('yargs')
const { azBatch } = require('./src/azbatch')
const { getAzRoles } = require('./roleassignments')




async function mainV4(token) {

  
    let AppOwnersOwnersBatch = require('./appOwners.json')

    // modify so, that the ID created in MAP can be mapped back to result
    let appOwners = await graphBatching(AppOwnersOwnersBatch, token?.access_token, (item) => item?.map(s => s = { content: s?.body?.value, id: s?.id }), 40, 5, 10, 'beta', {retryCount:2, awaitBetweenInMS:2000, totalRetryRuns:2})

    console.log()

}

module.exports={mainV4}


