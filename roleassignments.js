

const { default: axios } = require('axios')
const { azBatch } = require('./src/azbatch')
const { getARMToken } = require('./src/getArmToken')
const { decode } = require('jsonwebtoken')
const { resourceGraphGovernanceData } = require('./src/resourceGraphQ')


/* 
getAzRoles(require('./servicePrincipals.json'))
 */
async function getAzRoles(spnObjects) {


    let arm = await resourceGraphGovernanceData()

    spnObjects.map(s => {
        let assignments = arm.find(a =>  a?.properties_principalId == s?.id) 

      /*   if (assignments) {
            console.log()
        } */
        s.azRbac = assignments?.set_combinedRole || []
      
    })


    return spnObjects



}

module.exports={getAzRoles}