

var waitT = require('util').promisify(setTimeout)

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

    module.exports={batchThrottledSimple}