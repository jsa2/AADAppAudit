# Only needed when refresh token is not present. This will bypass the need to Consent MS graph application, as Azure CLI is pre-consented application
az login --allow-no-subscription --use-device-code
 
# Get the best possible scope that works generally with most Graph Operations. Ensure that the logged-in user is limited to read-only AAD role, to ensure no write operations are possible (The scope allows write permissions)
$graphAccessUserAsAll = az account get-access-token --scope="https://graph.microsoft.com/Directory.AccessAsUser.All" | ConvertFrom-Json
 
# Connect to MS Graph using the token
Connect-MgGraph -AccessToken $graphAccessUserAsAll.accessToken

$msTenants = "72f988bf-86f1-41af-91ab-2d7cd011db47", "0d2db716-b331-4d7b-aa37-7f1ac9d35dae", "f52f6d19-877e-4eaf-87da-9da27954c544", "f8cdef31-a31e-4b4a-93e4-5f571e91255a"
 
# Run a command to verify the connection
$applications = Get-MgApplication -All -PageSize 999

$oauth2permissionsGrants = Get-MgOauth2PermissionGrant -All -PageSize 999

# Run a command to verify the connection
$spns = Get-MgServicePrincipal -All -PageSize 999
$spnRoleAssignments = @()

foreach ($spn in $spns) {
$spn.DisplayName
$spnRoleAssignments +=Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $spn.Id -All -PageSize 999

}

$AllRolesAcrossSPNS = $spns.appRoles | ForEach-Object { $_ }



        foreach ($spn in $spns) {

        $spn | Add-Member -NotePropertyName "permissions" -NotePropertyValue @() -Force
        $spn | Add-Member -NotePropertyName "app" -NotePropertyValue @() -Force
        $spn.app = $applications | where {$_.AppId -match $spn.AppId}

        #Add permissions 
        $Oauth2Perms = $oauth2permissionsGrants | where {$_.ClientId -match $spn.Id}
        $roles = $spnRoleAssignments | where {$_.PrincipalId -match $spn.Id}

        foreach ($role in $roles) {

         $roleDisplayName = $AllRolesAcrossSPNS | Where-Object { $_.id -eq $role.appRoleId } | Select-Object -ExpandProperty value

         $role.ResourceDisplayName 
         $roleDisplayName
         $role.ResourceDisplayName
         $spn.permissions += "appRole: API:$($role.ResourceDisplayName) - value:$($roleDisplayName) "
         $spn.permissions

        }

        foreach ($perm in $Oauth2Perms) {

        #JS reference item.resourceDisplayName = spns.find((spn) => spn.id == item.resourceId)?.displayName || null
      
        $resourceDisplay =  $spns| where {$_.Id -match $perm.ResourceId} 
        
        if ($perm.ConsentType -eq "AllPrincipals") {
        
        $principal = $perm.ConsentType

        } else {
        $principal = $perm.PrincipalId
        }

        $spn.permissions += "principal: $($principal) - API:$($resourceDisplay.displayName) - Value: $($perm.scope)"
        }

       

        $appType = 'managedIdentity'

            if ($msTenants.Contains($spn.appOwnerOrganizationId) -or ($null -eq $spn.appOwnerOrganizationId -and $spn.servicePrincipalType -ne "ManagedIdentity")) {
                $appType = 'ms'
            } else {
             $appType = "external - multitenant"
            
            }


             if ($spn.app) {
               
                $appType = "internal - $($spn.signInAudience)"
            }


            
        $spn | Add-Member -NotePropertyName "AppType" -NotePropertyValue $appType -Force 

        $spn.app.Count
        #$spn.permissions 



        }



$spns | select displayName, apptype

