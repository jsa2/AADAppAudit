const { default: axios } = require("axios")



async function  trafficManagerDNSName (token, svc) {


        let lookup = svc.split('.trafficmanager.net')[0]
        let opt = {
            method:"post", 
            url:`https://management.azure.com/providers/Microsoft.Network/checkTrafficManagerNameAvailability?api-version=2022-04-01-preview`,
             headers:{
                 Authorization: `Bearer ${token}`
             },
             data:{
                "name": lookup,
                type:"Microsoft.Network/trafficManagerProfiles"
            }
        }
    

        try {

            let {data} = await axios(opt)
            return data
        } catch (err) {
            return err
        }
        

}

module.exports={trafficManagerDNSName}