const { default: axios } = require("axios");
const { randomUUID } = require('crypto');
const { argv } = require("yargs");
const syncWait = require('util').promisify(setTimeout)


//https://learn.microsoft.com/en-us/graph/json-batching



/* // Example (invoke to use)
async function main() {

    
// Prep item for batching 
let spns = require('./reflist2.json')?.unifiedObjectList?.filter(s => s?.servicePrincipal?.id).map( s => s = {url:`/servicePrincipals/${s?.servicePrincipal?.id}/appRoleAssignedTo`,method:"GET"})

let token = await getGraphTokenReducedScope()

 
//url: `/servicePrincipals/${s?.servicePrincipal?.id}/appRoleAssignedTo`,   
//method: "GET"

let results = await graphBatching(spns.splice(0,62),token,true,undefined,undefined,600)

console.log(results)

}
 */


async function graphBatching(items, token, returnFilter, batchSizeF, throttleIntervalf, throttleInMSf, endpoint, retryPolicy) {


    let batchSize = batchSizeF || 20
    let throttleInterval = throttleIntervalf || 2
    let throttleInMs = throttleInMSf || 2000
    let count = 0
    let batchObject = []
    var subBatch = []


    items.map(({ url, method, providedId }) => {

        subBatch.push({
            id: providedId || randomUUID(),
            url,
            method
        })

        count++
        // Creat batch of 20
        if (count % batchSize == 0) {
            /*  console.log() */
            batchObject.push(subBatch)
            //reset subBatch
            subBatch = []
        }


    })

    // push the residual subBatch to batch
    if (subBatch?.length !== 0) {
        batchObject.push(subBatch)
    }

    let promiseArray = []
    let batchNumber = 0
    for await (batch of batchObject) {

        batchNumber++
        console.log('batching', batchNumber, ' of ', batchObject.length)
        // Do small await between opening 5 new batch requests
        if (batchNumber % throttleInterval == 0) {
            console.log('implementing throttle')
            await syncWait(throttleInMs)
        }

        let opt = {
            url: `https://graph.microsoft.com/${endpoint || 'v1.0'}/$batch`,
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': "application/json",
            },
            method: "post",
            data: {
                requests: batch,
            }
        }

        promiseArray.push(axiosDataReturn(opt, { batchNumber, size: batch?.length }))

    }


    let data = await Promise.all(promiseArray)

    console.log(data.flat()?.length)

    if (retryPolicy|| argv?.retries) {
        // Check for errors 

        let i = 0

        for (let r = 0; (retryPolicy?.totalRetryRuns|| argv?.retries || 1) > r; r++)  {

            console.log('checking for possible retry')

            let retryBatch = data?.flat()?.filter(r => r?.status !== 200)

            if (retryBatch?.length == 0) {
                console.log(retryBatch?.length == 0)
                // break the loop as retries or retry count is satisfied 
                break ;
            }

            // filter data to not include retries as they will be readded soon
            data = data?.flat()?.filter(r => r?.status == 200)

            console.log()

    
            for await (retry of retryBatch) {
                i++
                console.log('retrying ', i)
                let result = await axiosDataReturn(retry?.opt, { batchNumber: i, size: retry?.opt?.data?.requests?.length })
                data.push(result)
                console.log()
            }


        }


    }

    if (returnFilter) {
        // values can be extracted, and thus only single array is returned


        return returnFilter(data.flat())
    }
    return data


}

async function axiosDataReturn(opt, batchIndicator) {

    try {
        let { data } = await axios(opt)
        console.log(`success on batch ${batchIndicator.batchNumber} of ${batchIndicator.size} requests`,)
        return data?.responses
    } catch (err) {
        // Return retry object
        console.log(err?.response?.data|| err?.code|| err)
        return {
            status: err?.response?.status, opt
        }
    }

}



async function graphBatchingBeta(items, token, returnFilter, batchSizeF, throttleIntervalf, throttleInMSf) {


    let batchSize = batchSizeF || 20
    let throttleInterval = throttleIntervalf || 2
    let throttleInMs = throttleInMSf || 2000
    let count = 0
    let batchObject = []
    var subBatch = []


    items.map(({ url, method, providedId }) => {

        subBatch.push({
            id: providedId || randomUUID(),
            url,
            method
        })

        count++
        // Creat batch of 20
        if (count % batchSize == 0) {
            /*  console.log() */
            batchObject.push(subBatch)
            //reset subBatch
            subBatch = []
        }


    })

    // push the residual subBatch to batch
    if (subBatch?.length !== 0) {
        batchObject.push(subBatch)
    }

    let promiseArray = []
    let batchNumber = 0
    for await (batch of batchObject) {

        batchNumber++
        console.log('batching', batchNumber, ' of ', batchObject.length)
        // Do small await between opening 5 new batch requests
        if (batchNumber % throttleInterval == 0) {
            console.log('implementing throttle')
            await syncWait(throttleInMs)
        }

        let opt = {
            url: "https://graph.microsoft.com/beta/$batch",
            headers: {
                authorization: `Bearer ${token}`,
                'content-type': "application/json",
            },
            method: "post",
            data: {
                requests: batch,
            }
        }

        promiseArray.push(axiosDataReturn(opt, { batchNumber, size: batch?.length }))

    }


    let data = await Promise.all(promiseArray)

    console.log(data.flat()?.length)

    if (returnFilter) {
        // values can be extracted, and thus only single array is returned
        console.log()

        return returnFilter(data.flat())
    }
    return data


}


module.exports = { graphBatching, graphBatchingBeta }