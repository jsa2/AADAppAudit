const { default: axios } = require("axios");
const query = require("./query");
const { getARMToken } = require("./getArmToken");


let unitSize = 1000

async function resourceGraphGovernanceData () {

    let token = await getARMToken()

    let data = {
        "options": {
            "$skip": 0,
            "$top": unitSize,
            "$skipToken": "",
            resultFormat: "ObjectArray"
        },
        query:query.query
    }

    let options = {
        method:"post",
        url:'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01',
        headers: {authorization: `Bearer ${token}`},
        data,
    }
    
     await govData(options)
    
     


     return results
}

let batch = []
let i = 0
let results = []

async function govData (options) {

    let skip = unitSize 
    let {data} = await axios(options).catch(err => {
        console.log()
    })
    if (data.data.length  == 0) {
        return []
    }
    if (data.totalRecords < unitSize) {
        data.data.forEach(item => results.push(item))
        return
    }
    let {totalRecords} = data 
    data.data.forEach((item) => results.push(item))

    let last = totalRecords % unitSize

    let batchCount = (totalRecords -unitSize - last) / unitSize
    if (batchCount > 0)
    do  {
        i++
        batch.push(unitSize)
        console.log(batch)
    } while (i !== batchCount)
    batch.push(last)
    for await (let unit of batch) {
        console.log(skip)
    options.data.options['$skip']=skip
    let {data: newData} = await axios(options)
    let {totalRecords: newTotalRecords} = newData 
    skip= skip + unit
    newData.data.forEach((item) => results.push(item))
    }

}

module.exports={resourceGraphGovernanceData}
