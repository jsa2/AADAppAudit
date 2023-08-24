const users = require('./users.json')
const oauth2Grants = require('./oauth2PermissionGrants.json')
const spns = require('./servicePrincipals.json')
const applications = require('./applications.json')
const roles = require('./roles.json').filter(s => s?.principalType == "ServicePrincipal")
const { getWebSitesName } = require('./src/dnslook')
const { parse } = require('url')
const admins = require('./material/admins.json')
const spnSignins = require('./lastSignin.json')
const { argv } = require('yargs')
const { trafficManagerDNSName } = require('./src/checkAvailability')
const { getMGMTToken } = require('./src/mgmtToken')

const msTenants = ["72f988bf-86f1-41af-91ab-2d7cd011db47", "0d2db716-b331-4d7b-aa37-7f1ac9d35dae", "f52f6d19-877e-4eaf-87da-9da27954c544", "f8cdef31-a31e-4b4a-93e4-5f571e91255a"]

main()

async function main() {


    oauth2Grants.map(item => {
        item.type = "oauth2PermissionGrants"
        item.userPrincipalName = users.find((user) => user.id == item.principalId)?.displayName || item?.consentType
        item.resourceDisplayName = spns.find((spn) => spn.id == item.resourceId)?.displayName || null
    }
    )

    let AllRolesAcrossSPNS = spns.map(spn => spn?.appRoles).flat()

    roles.map((item) => {
        item.type = "AppRole"
        item.roleDisplayName = AllRolesAcrossSPNS.find(s => s?.id == item?.appRoleId)?.value
        item.scope = AllRolesAcrossSPNS.find(s => s?.id == item?.appRoleId)?.value
        /* console.log() */
    })




    spns.map((item) => {

        item.lastSignIn = spnSignins?.find(s => s?.appId == item?.appId)|| null
        let app = applications.find((spn) => spn.appId == item.appId)
        item.permissions = roles.filter(s => s?.principalId == item?.id)
        item.permissions.push(oauth2Grants.filter(s => s?.clientId == item?.id))
        item.permissions = item.permissions.flat()
        /* item.permissionsReading = item?.permissions.map(s => s=`${s?.type} --> ${s?.principalDisplayName || s?.userPrincipalName} --> ${s?.resourceDisplayName} - permission: ${s?.roleDisplayName || s?.scope}`)
        */


        item.implicitGrant = app?.web?.implicitGrantSettings || null


        item.permissionsReading = item?.permissions.map(s => s?.scope?.split(' ')
            .map(scp => scp = `${s?.type} --> ${s?.principalDisplayName || s?.userPrincipalName} --> ${s?.resourceDisplayName} - permission: ${s?.roleDisplayName || scp}`)).flat()





        item.isAdminAADrole = admins.filter((role) => role.appId == item.appId)?.map(s => s?.role)

        if (item?.isAdminAADrole.length > 0) {
           // console.log()
        }

        // If the app is managed it wont hit any of the following IF conditions


        let appType = 'managedIdentity'

        if (msTenants.includes(item.appOwnerOrganizationId) || (item.appOwnerOrganizationId == null && item.servicePrincipalType !== "ManagedIdentity")) {
            appType = 'ms'
        }

        if (app) {
            appType = `internal - ${item.signInAudience}`
        }

        if (appType !== "ms" && !app && item?.servicePrincipalType !== "ManagedIdentity" && item?.appOwnerOrganizationId !== null) {
            appType = `external - multitenant`
        }
        // AppType check ends
        // Credentials

        item.appType = appType
        item.ApplicationHasPassword = app?.passwordCredentials || item.passwordCredentials
        item.ApplicationHasPublicClient = app?.isFallbackPublicClient || null
        item.allCredentials = []

        item.FullCredentials = {
            spnPassword:item.passwordCredentials,
            spnKeyCredential: item.keyCredentials,
            spnFederatedCredentials: item.federatedCredentials
        }

        item.passwordCredentials.map(s => item.allCredentials.push(`SPNPassword:${s.keyId}`))
        item.keyCredentials.map(s => item.allCredentials.push(`SPNCert:${s.keyId}`))
        item.federatedCredentials.map(s => item.allCredentials.push(`SPNFederatedCred:${s.issuer}`))

        item.requiredResourceAccessOnlyPresentOnApps = []

        if (app) {
            app.passwordCredentials.map(s => item.allCredentials.push(`AppPassword:${s.keyId}`))
            app.keyCredentials.map(s => item.allCredentials.push(`AppCert:${s.keyId}`))
            app.federatedCredentials.map(s => item.allCredentials.push(`appFederatedCred:${s.issuer}`))

            app.requiredResourceAccess.map(s  => {

                let resource = spns.find(r  => r.appId == s?.resourceAppId)
             
                if (!resource) {
                    return;
                }
                
                let matches = s?.resourceAccess.map(a => resource?.appRoles.find(appR => a.id == appR?.id) || resource?.oauth2PermissionScopes.find(appR => a.id == appR?.id))
   

                  matches.forEach(m =>item.requiredResourceAccessOnlyPresentOnApps.push(`${m?.type || m?.origin} - ${m?.value} - ${resource?.displayName}`) )
                  if (matches.length > 1) {
                    
                    //console.log(app.requiredResourceAccess)
                  }

            })

            item.FullCredentials = {
                appPassword:app.passwordCredentials,
                appKeyCredential: app.keyCredentials,
                appFederatedCredentials: app.federatedCredentials
            }
        }

    })

    let rs = []
    let checked = []
    let c = 0
    

    if (argv?.includeMSresults) {

        spns.map(spn => {
            spn.replyUrls.filter(item => item.match('azurewebsites.net|trafficmanager.net|blob.core.windows.net')).forEach(item => {
                let fqdn = parse(item)?.hostname
                if (!checked.includes(fqdn)) {
                    checked.push(fqdn)
                    rs.push(getWebSitesName({ fqdn: fqdn, id: spn.id }))
                } else {
                    /*  console.log('already checked') */
                }
    
    
            })
        })

    } else {
        spns.filter(spn => spn?.appType !=='ms' ).map(spn => {
            spn.replyUrls.filter(item => item.match('azurewebsites.net|trafficmanager.net|blob.core.windows.net')).forEach(item => {
                let fqdn = parse(item)?.hostname
                if (!checked.includes(fqdn)) {
                    checked.push(fqdn)
                    rs.push(getWebSitesName({ fqdn: fqdn, id: spn.id }))
                } else {
                    /*  console.log('already checked') */
                }
    
    
            })
        })
    }

    let s = await Promise.all(rs)
    let dangl = s.filter(item => item.failed == true)

    console.log(argv.checkTrafficManagerAvailability)
    if (argv.checkTrafficManagerAvailability) {
        console.log('checking for Azure Trafficmanager availablity')
        let names = dangl.filter(s => s?.fqdn?.match('trafficmanager.net'))
        let token =await getMGMTToken()
        for await (let r of names) {

            let result = await trafficManagerDNSName(token,r?.fqdn)
            console.log(result)

            dangl.map(s => {
                s.vulnerable= result?.nameAvailable || result
            })

        }
        
    }

    spns.map(item => {

        item.danglingRedirect = dangl.filter(spn => item.replyUrls.toString().match(spn?.fqdn)) || undefined || {}
    })

    require('fs').writeFileSync('./material/servicePrincipalsUP.json', JSON.stringify(spns))

    /*     require('fs').writeFileSync('./material/oauth2PermissionGrantsUP.json', JSON.stringify(oauth2Grants))
     */
    console.log('done')

}

