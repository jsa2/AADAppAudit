const { axiosClient } = require("./src/axioshelpers")
const { graphBatchingBeta, graphBatching } = require("./src/batcher")
const getToken = require("./src/getToken")

module.exports = { admins }

async function admins() {

    var graphToken = await getToken()

    var { value: roles } = await genericGraph({
        responseType: 'json',
        "method": "get",
        url: `https://graph.microsoft.com/beta/directoryRoles/`,
        headers: {
            'content-type': "application/json",
            authorization: "Bearer " + graphToken
        }
    }).catch((error) => {
        console.log(error)
    })



    // get strange stuff in headers
    let rolesForBatch = roles.map(item => item = { url: `/directoryRoles/${item.id}/members?select=id,displayName,appId`, method: "GET", providedId: item?.displayName })



    const admins = await graphBatching(rolesForBatch, graphToken, (item) => item?.map(s => s = { value: s?.body?.value, id: s?.id }), undefined, 5, 200, 'beta')
    const groups =[]
    const list = []
    admins.map(it => {
        it.value.filter(ob => ob['@odata.type'] !== '#microsoft.graph.user').forEach(spn => {
            let { appId, id, displayName } = spn
                if (spn['@odata.type'] == '#microsoft.graph.group') {
                    groups.push({ id, displayName, appId, role: it.id })
                }
            list.push({ id, displayName, appId, role: it.id })
        })
    })


    let rolesViaGroupAssignment = groups.map(item => item = { url: `/groups/${item.id}/members/microsoft.graph.servicePrincipal?select=id,displayName,appId`, method: "GET", providedId: `${item?.role}-via-${item?.displayName}` })

    const adminsViaGroups = await graphBatching(rolesViaGroupAssignment, graphToken, (item) => item?.map(s => s = { value: s?.body?.value, id: s?.id }), undefined, 5, 200,'beta')

    adminsViaGroups.forEach(it => {
        it.value.forEach(spn => {
            let { appId, id, displayName } = spn
            list.push({ id, displayName, appId, role: it.id })
        })
    })

    if (list.length > 0) {
        require('fs').writeFileSync('./material/admins.json', JSON.stringify(list))
        return "admin completed"
    }


    require('fs').writeFileSync('./material/admins.json', `[{"role":"","displayName":""}]`)

}



async function genericGraph(options) {
    console.log(options.url)
    if (options?.refInfo) {
        var { refInfo } = options
        delete options.refInfo
    }
    var data = await axiosClient(options).catch((error) => {
        return Promise.reject(error)
    })

    if (refInfo) {
        data.refInfo = refInfo
        return data
    } else {
        return data
    }
}