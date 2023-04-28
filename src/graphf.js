

const { decode } = require('jsonwebtoken');
const { axiosClient } = require('./axioshelpers');

async function graph (token, operation) {

    console.log('checking', operation)

        var options = {
            responseType: 'json',
            "method": "get",
            url:`${token.resource}/v1.0/${operation}`,
            headers:{
                'content-type':"application/json",
                authorization:"bearer " + token['access_token']
            },
          /*   timeout:2000 */
        }

    options
    var data = await axiosClient(options).catch((error) => {
        return Promise.reject(error)
    })

    return data?.value || data

}

async function graphExtended (token, operation) {

    console.log('checking', operation)
   

    var options = {
        responseType: 'json',
        "method": "get",
        url:`https://graph.microsoft.com/beta/${operation}`,
        headers:{
            'content-type':"application/json",
            authorization:"bearer " + token['access_token']
        },
      /*   timeout:2000 */
    }

options
var data = await axiosClient(options).catch((error) => {
    return Promise.reject(error)
})

return data?.value || data

}

async function graphOwner (token, operation,appId) {

    console.log('checking', operation)

        var options = {
            responseType: 'json',
            "method": "get",
            url:`${token.resource}/v1.0/${operation}`,
            headers:{
                'content-type':"application/json",
                authorization:"bearer " + token['access_token']
            },
          /*   timeout:2000 */
        }

    options
    var data = await axiosClient(options).catch((error) => {
        return Promise.reject(error)
    })

    return {userPrincipalName:data?.value, appId} || data

}



async function graphListS (token, operation, skiptoken, responseCollector) {

    var options = {
        responseType: 'json',
        "method": "get",
        url:`${token.resource}/beta/${operation}`,
        headers:{
            'content-type':"application/json",
            authorization:"bearer " + token['access_token']
        }
    }

    if (skiptoken) {
        options.url = skiptoken
    }

var data = await axiosClient(options).catch((error) => {
    return Promise.reject(error)
})


if (data['@odata.nextLink']) {
    console.log('getting results:',data.value.length)
    data.value.forEach((item) => responseCollector.push(item))
    console.log(data['@odata.nextLink'])
    await graphListS(token,operation,data['@odata.nextLink'],responseCollector)

}
else {
   return data.value.forEach((item) => responseCollector.push(item))
}

}



async function graphList (token, operation, skiptoken, responseCollector) {

        var options = {
            responseType: 'json',
            "method": "get",
            url:`${token.resource}/v1.0/${operation}`,
            headers:{
                'content-type':"application/json",
                authorization:"bearer " + token['access_token']
            }
        }

        
    
        if (skiptoken) {
            options.url = skiptoken
        }

    var data = await axiosClient(options).catch((error) => {
        return Promise.reject(error)
    })


    if (data['@odata.nextLink']) {
        data.value.forEach((item) => responseCollector.push(item))
        console.log(data['@odata.nextLink'])
        await graphList(token,operation,data['@odata.nextLink'],responseCollector)

    }
    else {
       return data.value.forEach((item) => responseCollector.push(item))
    }

}


async function batchThrottledSimple (burstCount, arrayOfObjects) {

    var promArra = []
    var returnObject = []
    let i = 0
    
        for await ({runContext} of arrayOfObjects) {
            i++
           // console.log(i)
    
            var {fn,opts} = runContext
            
            if (i % burstCount == 0) {
                await waitT(1000)
            }
            
            promArra.push(
                fn(opts).catch((error) => {
                    console.log('no match in graph', opts)
                    //returnObject.push({error:resourceId})
                }).then((data) => {
                    if (data) {
                        returnObject.push(data)
                    }
                    
                })
            )
    
        }
    
    await Promise.all(promArra)
    return returnObject
    
    }



var waitT = require('util').promisify(setTimeout)

async function batchThrottled (run, burstCount, arrayOfObjects, token) {

var promArra = []
var returnObject = []
let i = 0

    for await (item of arrayOfObjects) {
        i++
        console.log(i)

        if (i % burstCount == 0) {
            await waitT(1000)
        }

        promArra.push(
            run(item,token).catch((error) => {
                returnObject.push(item.error = error)
            }).then((data) => {
                console.log(data)
                returnObject.push(data)
            })
        )

    }

await Promise.all(promArra)
return returnObject

}

async function graphListMod(token, operation, skiptoken, responseCollector) {

    let options = {
        responseType: 'json',
        "method": "get",
        url: `https://graph.microsoft.com/v1.0/${operation}`,
        headers: {
            'content-type': "application/json",
            authorization: "bearer " + token,
            ConsistencyLevel: "eventual"
        },
    }

    if (skiptoken) {
        options.url = skiptoken
    }

    let data = await axiosClient(options).catch((error) => {
        return Promise.reject(error)
    })

    if (data['@odata.nextLink']) {
        data.value.forEach((item) => responseCollector.push(item))
        console.log(data['@odata.nextLink'])
        await graphListMod(token, operation, data['@odata.nextLink'], responseCollector)

    }
    else {
        return data.value.forEach((item) => responseCollector.push(item))
    }

}

async function graphListModBeta(token, operation, skiptoken, responseCollector) {

    let options = {
        responseType: 'json',
        "method": "get",
        url: `https://graph.microsoft.com/beta/${operation}`,
        headers: {
            'content-type': "application/json",
            authorization: "bearer " + token,
            ConsistencyLevel: "eventual"
        },
    }

    if (skiptoken) {
        options.url = skiptoken
    }

    let data = await axiosClient(options).catch((error) => {
        return Promise.reject(error,options)
    })

    if (data['@odata.nextLink']) {
        data.value.forEach((item) => responseCollector.push(item))
        console.log(data['@odata.nextLink'])
        await graphListMod(token, operation, data['@odata.nextLink'], responseCollector)

    }
    else {
        return data.value.forEach((item) => responseCollector.push(item))
    }

}





module.exports={graph, graphList, batchThrottled,graphOwner,graphListS, graphExtended, graphListMod,graphListModBeta}
