const { graphListMod, graphListModBeta } = require('./src/graphf')
const fs = require('fs')
const { graphBatching } = require('./src/batcher')
const { randomUUID } = require('crypto')
const { argv } = require('yargs')
const { azBatch } = require('./src/azbatch')
const { getAzRoles } = require('./roleassignments')



module.exports = { mainV2 }

async function mainV2(token) {

    // Group main objects

     let opsPromarra = []
 
 
     let ops = [
         {
             type: "appsOwner",
             objects: [],
             query: ['/applications?$filter=owners/$count ne 0&$count=true&$top=999']
         },
         {
             type: "appsNoOwner",
             objects: [],
             query: ['/applications?$filter=owners/$count eq 0&$count=true&$top=999']
         },
         {
             type: "spnOwner",
             objects: [],
             query: ['/servicePrincipals?$filter=owners/$count ne 0&$count=true&$top=999']
         },
         {
             type: "spnNoOwner",
             objects: [],
             query: ['/servicePrincipals?$filter=owners/$count eq 0&$count=true&$top=999']
         },
         {
             type: "oauth2PermissionGrants",
             objects: [],
             query:"oauth2PermissionGrants?$top=999"
         },
         {
            type: "applications",
            objects: [],
        },
        {
            type: "serviceprincipals",
            objects: [],
        }
     ]
 
 
     
     ops.filter(s =>s?.query).forEach(op => {
         console.log('checking ', op)
         opsPromarra.push(graphListMod(token?.access_token, op?.query, undefined, op.objects))
 
     })
 
 
     try {
         await Promise.all(opsPromarra)
     } catch (err) {
         console.log(err)
     }
     fs.writeFileSync('ops.json', JSON.stringify(ops))

     // Check for betaSign-ins 

     const lastSignIn = []
     try {
        await graphListModBeta(token?.access_token, '/reports/servicePrincipalSignInActivities', undefined,lastSignIn)
     } catch (err) {
        console.log('skipping lastsignins, user likely not in required role')
     }
     

     //
 
     //store the raw ops file, so no further processing is needed for development
 
 /* 
    ops = require('./ops.json') */


    // Write all of the files from the ops
    /*  ops.forEach(f => fs.writeFileSync(`${f?.type}.json`, JSON.stringify(f?.objects))) */

    // Transform new unified object with just owners and servicePrincipals 
    
    ops.filter(s => s?.type.match('apps') || s?.type.match('spn')).forEach(s => s.objects.map(ob => ob.HasOwner = s?.type))
    
    ops.filter(s => s?.type.match('apps') || s?.type.match('spn')).forEach(s => s.objects.forEach(ob => {
        if (ob?.HasOwner.match('apps')) {
            ops.find(s => s?.type == 'applications').objects.push(ob)
        }

        if (ob?.HasOwner.match('spn')) {
            ops.find(s => s?.type == 'serviceprincipals').objects.push(ob)
        }
    }))

    let clean = ops.filter( s =>!s?.type.match('Owner'))


    // Array destruct
    let [oauth2PermissionGrantsOp, applicationsOp, servicePrincipalsOp] = clean

    // further Destructure
    let { objects: applications } = applicationsOp;
    let { objects: servicePrincipals } = servicePrincipalsOp;
    let { objects: oauth2PermissionGrants } = oauth2PermissionGrantsOp;


    let usersBatch = Array.from(new Set(oauth2PermissionGrants.map(user => user.principalId))).filter(s => s)
        .map(s => s = { url: `/users/${s}`, method: "GET" })


    // Symmetric return filter is implemented for users (assumes all values are symmetric)

    let users = await graphBatching(usersBatch, token?.access_token, (item) => item?.map(s => s?.body),undefined,undefined,'beta')


    fs.writeFileSync('users.json', JSON.stringify(users))

    // FedCreds

    let filteredOpsPromArra = []

    let filteredOpsNext = [
        {
            type:"spnFedCred",
            query: "/servicePrincipals?$filter=federatedIdentityCredentials/$count ne 0&$count=true&$select=id,appId",
            objects: []
        },
        {
            type:"appFedCred",
            query: "/applications?$filter=federatedIdentityCredentials/$count ne 0&$count=true&$select=id,appId",
            objects: []
        }
    ]

    try {

        filteredOpsNext.forEach(op => {
            console.log('checking ', op)
            filteredOpsPromArra.push(graphListMod(token?.access_token, op?.query, undefined, op.objects))
            /*   console.log() */

        })

        await Promise.all(filteredOpsPromArra)
        console.log()
        // Map federated credentials to applications and servicePrincipals



    } catch (err) {
        console.log(err)
    }

    let [spnFedCred,appFedCred] = filteredOpsNext

    let appFedCredsListBatch = appFedCred?.objects
    .map(s => s = { url: `/applications/${s?.id}/federatedIdentityCredentials?$top=999`, method: "GET", providedId: s?.id })

    // modify so, that the ID created in MAP can be mapped back to result
    let appFedCreds = await graphBatching(appFedCredsListBatch, token?.access_token, (item) => item?.map(s => s = { content: s?.body?.value, id: s?.id }), undefined, 5, 200)

    console.log(appFedCreds?.length)

    let spnFedCredsListBatch = spnFedCred?.objects
    .map(s => s = { url: `/servicePrincipals/${s?.id}/federatedIdentityCredentials?$top=999`, method: "GET", providedId: s?.id })

    // modify so, that the ID created in MAP can be mapped back to result
    let spnFedCreds = await graphBatching(spnFedCredsListBatch, token?.access_token, (item) => item?.map(s => s = { content: s?.body?.value, id: s?.id }), undefined, 5, 200)

    console.log(spnFedCreds?.length)

    applications.map(s => s.federatedCredentials = appFedCreds.find(app => app?.id == s?.id)?.content ||[])

    servicePrincipals.map(s => s.federatedCredentials = spnFedCreds.find(spn => spn?.id == s?.id)?.content ||[])

    // AppOwnersOwners and

    let AppOwnersOwnersBatch = applications.filter(app => app.HasOwner == 'appsOwner')
    .map(s => s = { url: `/applications/${s?.id}/owners?$select=id,displayName&$top=999`, method: "GET", providedId: s?.appId })

    fs.writeFileSync('appOwners.json',JSON.stringify(AppOwnersOwnersBatch,undefined,4))

    // modify so, that the ID created in MAP can be mapped back to result
    let appOwners = await graphBatching(AppOwnersOwnersBatch, token?.access_token, (item) => item?.map(s => s = { content: s?.body?.value, id: s?.id }), undefined, 5, 200)

    console.log(appOwners?.length)


    let SPNOwnersOwnersBatch = servicePrincipals.filter(spn => spn.HasOwner == 'spnOwner')
    .map(s => s = { url: `/servicePrincipals/${s?.id}/owners?$select=id,displayName,AppId&$top=999`, method: "GET", providedId: s?.appId })

    // modify so, that the ID created in MAP can be mapped back to result
    let SPNOwners = await graphBatching(SPNOwnersOwnersBatch, token?.access_token, (item) => item?.map(s => s = { content: s?.body?.value, id: s?.id }), undefined, 5, 200)

    console.log(SPNOwners?.length)


 /*    fs.writeFileSync('SPNOwners.json', JSON.stringify(SPNOwners)) */

    //Map Owners to SPNS
    servicePrincipals.map( s=> {
        let ownersInApplication  = appOwners.find(app => app?.id == s?.appId)?.content.map(owner => `AppOwner:${owner?.displayName}`) || []
        let ownersInSPN  = SPNOwners.find(app => app?.id == s?.appId)?.content.map(owner => `SPNOwner:${owner?.displayName}`) || []
        s.owners = [ownersInApplication,ownersInSPN].flat()
        
        
    })


    // AppRoleAssignedTo


    // This was changed to appRoleAssignments from the "AppRoleAssignedTo" as the latter in case of Graph can easily have more than 999 instances. Otherwise it is more rare to have single app given more than 999 AppRole Assignments 
    let spnAppRoleAssignedBatch = servicePrincipals.map(app => app.id)
        .map(s => s = { url: `/servicePrincipals/${s}/appRoleAssignments?$top=999`, method: "GET", providedId: s })

        
        

  /*  
  // Allows to debug higher batch sizes for logic throttling testing
  servicePrincipals.map(app => app.id).forEach( s => {
    for (let index = 0; index < 3; index++) {

        if (index % 6 == 0  || index % 5 == 0) {
            spnAppRoleAssignedBatch.push({ url: `/servicePrincipals/${s}/appRoleAssignedTo`, method: "GET", providedId: randomUUID() })
        }

        spnAppRoleAssignedBatch.push({ url: `/servicePrincipals/${s}/appRoleAssignedTo`, method: "GET", providedId: randomUUID() })
    }
   }) */



    // modify so, that the ID created in MAP can be mapped back to result
    let spnAppRoleAssigned = await graphBatching(spnAppRoleAssignedBatch, token?.access_token, (item) => item?.map(s => s = s?.body?.value).flat(), undefined, 5, 200)

    console.log(spnAppRoleAssigned?.length)

    if (argv?.azRbac) {
        console.log('getting AzRoles')
        await getAzRoles(servicePrincipals).catch(err => {
            console.log()
        })
        console.log()

    }

    fs.writeFileSync(`roles.json`, JSON.stringify(spnAppRoleAssigned))
   
    fs.writeFileSync('servicePrincipals.json',JSON.stringify(servicePrincipals))

    fs.writeFileSync('oauth2PermissionGrants.json',JSON.stringify(oauth2PermissionGrants))

    fs.writeFileSync('lastSignin.json',JSON.stringify(lastSignIn))


    fs.writeFileSync('applications.json',JSON.stringify(applications))

    console.log()
}
