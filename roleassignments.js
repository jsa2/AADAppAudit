

const { default: axios } = require('axios')
const { azBatch } = require('./src/azbatch')
const { getARMToken } = require('./src/getArmToken')
const { decode } = require('jsonwebtoken')


getAzRoles(require('./servicePrincipals.json'))

async function getAzRoles(spnObjects) {

    let token = await getARMToken()

    spnObjects.map(s => s.azRbac = [])

    let tokenDetails = decode(token)

    let { data: subs } = await axios({
        url: 'https://management.azure.com/subscriptions?api-version=2020-01-01',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    let { data: roleDefs } = await axios({
        url: 'https://management.azure.com/providers/Microsoft.Authorization/roleDefinitions?api-version=2018-01-01-preview',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    console.log(subs)


    //Check only for subs that are in the tenant the token is issued for 
    for await (sub of subs?.value?.filter(s => s?.tenantId == tokenDetails?.tid)) {

        let rgList = spnObjects.map(s => s = { url: `https://management.azure.com/subscriptions/${sub?.subscriptionId}/providers/Microsoft.Authorization/roleAssignments?%24filter=assignedTo('${s?.id}')&api-version=2020-04-01-preview`, httpMethod: "GET" })

        let assignmentsOnResourceLevel = await azBatch(rgList, token, (item) => item?.map(s => s = { content: s?.content?.value, id: s?.name }), undefined, 4, 1000)
      
        let som = assignmentsOnResourceLevel?.filter(s => s?.content?.length > 0).map(ob => ob?.content?.map(oc => oc?.properties)).flat()

        som.map(r => r.roleDefinitionName = roleDefs?.value?.find(s => s?.id?.split('/').pop() == r?.roleDefinitionId?.split('/').pop())?.properties?.roleName)
        
        let simplifiedVer = som.map(s => {
            let {roleDefinitionName, scope, principalId} = s
            return {roleDefinitionName, scope, principalId}
        })

        spnObjects.map(sp => {
            let sd = simplifiedVer.filter(s => s?.principalId == sp?.id)

            if (sp?.id == "2db91dcb-058f-462f-89c0-1ce91ce12025") {
                console.log()
            }

            if (sd?.length > 0) {
                console.log(sp)
                sp.azRbac.push(sd)
                sp.azRbac = sp.azRbac?.flat()
                console.log(sp?.azRbac)
            }
            
        })
        console.log()

       
        

    }

    console.log()
    
    return spnObjects



}

module.exports={getAzRoles}