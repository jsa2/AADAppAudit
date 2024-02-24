- [Azure AD Application Analytics Solution](#azure-ad-application-analytics-solution)
- [Before using this tool](#before-using-this-tool)
- [Release notes](#release-notes)
  - [List of checks](#list-of-checks)
- [Requirements and operation](#requirements-and-operation)
  - [Operation](#operation)
  - [After running the tool](#after-running-the-tool)
  - [Running in local mode (CSV generation)](#running-in-local-mode-csv-generation)
- [Limitations](#limitations)
- [Contribution](#contribution)


# Azure AD Application Analytics Solution

Major Refactor of previous [solution](https://github.com/jsa2/CloudShellAadApps/tree/public#consent-and-azure-ad-application-analytics-solution) 
 - You can read about some of the use cases in the previous solutions documentation [solution](https://github.com/jsa2/CloudShellAadApps/tree/public#consent-and-azure-ad-application-analytics-solution) 

# Before using this tool 
Read the [MIT license](LICENSE)

⚠ Only use this tool if you know what you are doing and have reviewed the code

⚠ Always test the tool first in test environments with non-sensitive data

# Release notes
    Beta 
    Beta v 0.2.1
    - Retry mode added. use "--retry=2" to run two retry loops for requests not batched with response code 200. The main use case is to throttle HTTP code 429 when using the $batch endpoint of graph. This is partial address to earlier issue which referenced issues in larger tenants https://github.com/jsa2/AADAppAudit/issues/9  
    Beta v 0.1.8
    - LastSignInTime as per https://learn.microsoft.com/en-us/graph/api/reportroot-list-serviceprincipalsigninactivities?view=graph-rest-beta
    Beta v 0.1.7 
     - Azure RBAC assigments directly assigned to SPNs now available 
    Beta v 0.1.6
    - Added check for SPN assignments via groups
    Beta
    - Added check for implicit grant
    Beta v 0.1.5
    - Uses now DefaultAzureCredential to create SAS tokens and upload blobs as per JonneK pull request
    Beta v 0.1.0
    - Compared to previous version uses now JSON batching and larger resultsize across all queries. 2-3x faster than the previous version
    - Release for Azure Security meetup UG

**Major performance improvement with JSON batching**
![](20230428144229.png)

## List of checks 

### Additional Explanations

#### includesMultipleCredentialSources 
* **Description:** This feature identifies cases where an application possesses credentials both in the Service Principal (SPN) and on the application's side. It's particularly useful because the user interface does not show credentials that are on the SPN side.

#### MultitenantAppWithTenantedCreds
* **Description:** Refers to multi-tenant applications where all credentials should be in the home tenant. However, if some credentials are added to your tenant, it implies a significant risk of impersonation within your tenant.

#### SharedAppForUserAndAppPermissions
* **Description:** This scenario involves applications that combine both application and delegated permissions. The risk here is that a compromised client secret, which normally requires a user's authorization code or refresh token for delegated permissions, can now be used independently.


1. List app type

![](20230428143147.png)

2. Collect appOwners from both objects (when both exist) spn and application

![](20230308090027.png)

3. Collect all credential types from both objects (when both exist) spn and application

![](20230428143314.png)

4. Review replyUrls for dangling DNS records 

![](20230428143500.png)

- Please note, in case of multitenant app, these values might be outdated (ReplyURL changes are not reflected visibly on the resulting SPN object, but are nonetheless effective)

5. Check if the object has been assigned AAD roles

![](20230428143354.png)

6. List API permissions in the following format 

```json
{ "permissionsReading": [
          "\"AppRole --> api-15764 --> Microsoft Graph - permission: PrivilegedAccess.Read.AzureAD\"",
          "\"AppRole --> api-15764 --> Microsoft Graph - permission: RoleManagement.Read.All\"",
          "\"AppRole --> api-15764 --> Microsoft Graph - permission: PrivilegedAccess.Read.AzureResources\"",
          "\"AppRole --> api-15764 --> Microsoft Graph - permission: PrivilegedAccess.Read.AzureADGroup\"",
          "\"AppRole --> api-15764 --> Office 365 Management APIs - permission: ActivityFeed.Read\"",
          "\"oauth2PermissionGrants --> AllPrincipals --> Microsoft Graph - permission: User.Read\"",
          "\"oauth2PermissionGrants --> AllPrincipals --> Microsoft Graph - permission: Directory.AccessAsUser.All\"",
          "\"oauth2PermissionGrants --> admin santasalo --> Microsoft Graph - permission: User.Read\"",
      ]
    }
```

7. List Azure RBAC permissions available using by the use of ``--azRbac`` option 

    example: ``node main storageAccount --azRbac`` 
    
    - In the query that is pasted to Log Analytics, you need to expand it as follows by adding ``azRbac`` into the ``project`` statement 

![Alt text](image.png)

7. Change the ``project`` with ``lastSignIn`` , and add to the last line `` extend lastSignInDate = parse_json(lastSignIn).lastSignInActivity.lastSignInDateTime``
```sql
let home="033794f5-7c9d-4e98-923d-7b49114b7ac3"; 
 //
let admins = (externaldata (id: string, displayName: string, role: string)[@""] with (format="multijson"));
 //
let doNotRemove = (externaldata (test: string)[@""] with (format="multijson"));
// 
// Pre-existing part from query (Dont paste this, just for example here)
//
let servicePrincipalsUP = (externaldata (id: string, deletedDateTime: dynamic, accountEnabled: string, alternativeNames: dynamic, appDisplayName: string, appDescription: dynamic, appId: string, applicationTemplateId: dynamic, appOwnerOrganizationId: string, appRoleAssignmentRequired: string, createdDateTime: string, description: dynamic, disabledByMicrosoftStatus: dynamic, displayName: string, homepage: dynamic, loginUrl: dynamic, logoutUrl: dynamic, notes: dynamic, notificationEmailAddresses: dynamic, preferredSingleSignOnMode: dynamic, preferredTokenSigningKeyThumbprint: dynamic, replyUrls: dynamic, servicePrincipalNames: dynamic, servicePrincipalType: string, signInAudience: string, tags: dynamic, tokenEncryptionKeyId: dynamic, samlSingleSignOnSettings: dynamic, addIns: dynamic, appRoles: dynamic, info: dynamic, keyCredentials: dynamic, oauth2PermissionScopes: dynamic, passwordCredentials: dynamic, resourceSpecificApplicationPermissions: dynamic, verifiedPublisher: dynamic, HasOwner: string, federatedCredentials: dynamic, owners: dynamic, lastSignIn: dynamic, permissions: dynamic, implicitGrant: dynamic, permissionsReading: dynamic, isAdminAADrole: dynamic, appType: string, ApplicationHasPassword: dynamic, ApplicationHasPublicClient: dynamic, allCredentials: dynamic, FullCredentials: dynamic, requiredResourceAccessOnlyPresentOnApps: dynamic, danglingRedirect: dynamic)[@""] with (format="multijson"));
 // // //////// ///////
 // The actual change lastSignIn
servicePrincipalsUP
| project appId, displayName, appType, permissionsReading, allCredentials, owners, isAdminAADrole, danglingRedirect, lastSignIn
| extend includesMultipleCredentialSources = case(tostring(allCredentials) contains "App" and tostring(allCredentials) contains "SPN", true, false)
| extend MultitenantAppWithTenantedCreds = iff(tostring(allCredentials) contains "SPN" and appType !contains "internal" and appType !contains "managed" , true, false )
| extend SharedAppForUserAndAppPermissions = iff(tostring(permissionsReading) contains "AppRole -->" and tostring(permissionsReading) contains "oauth2PermissionGrants -->" , true, false )
| extend lastSignInDate = parse_json(lastSignIn).lastSignInActivity.lastSignInDateTime

```

# Requirements and operation

Access to Azure Cloud Shell (Bash)
- Permissions to [create](#provision-new) new storage account or to use [existing](#use-existing-storage-account) one.
- Access to Log Analytics workspace 
- Azure CLI installed (this get tokens from the underlying Azure CLI installation)
- Storage Blob Contributor Role on the Storage Account 

https://learn.microsoft.com/en-us/azure/storage/blobs/assign-azure-role-data-access?tabs=portal

![image](https://user-images.githubusercontent.com/58001986/236482756-b5fcbc82-c018-451e-b31d-999a8aa899ac.png)


  
| Requirement                                                    | description                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Access to Azure Cloud Shell Bash                             | Uses pre-existing software on Azure CLI, Node etc                                                                                                                                                                                                                                                                                                     |
| ✅ Permissions to Azure subscription to create needed resources | Tool creates a storage account and a resource group. Possible also to use existing storage account. In both scenarios tool generates short lived read-only shared access links (SAS) for the ``externalData()`` -[operator](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/externaldata-operator?pivots=azuredataexplorer#examples) |
| ✅ User is Azure AD member                                      | Cloud-only preferred with read-only Azure AD permissions. More permissions are needed if sign-in events are included                                                                                                                                                                                                                                  |
| ✅ Existing Log Analytics Workspace                             | This is where you paste the output from this tool                                                                                                                                                                                                                                                                                                     |


 **About the generated KQL**
- The query is valid for 10 minutes, as SAS tokens are only generated for 10 minutes


**Start**

    git clone https://github.com/jsa2/AADAppAudit

    cd AADAppAudit

## Operation


If you are running the tool in Azure Cloud Shell then all depedencies are already installed

**If you want to use with SAS token** use this [branch](https://github.com/jsa2/AADAppAudit/tree/SASTokenVer#use-existing-storage-account) instead 

```sh
# in the folder where the solution was installed 
npm install

node main yourstorageaccountshortname

# paste the code in runtime.kql to the desired log analytics worspace
# "navigate to kql/runtime.kql if code does not open up



```
**Run the pasted query in the workspace**

![](20230428145234.png)

## After running the tool

- Remove installation of this service (removes the json files that were stored for the query)
- Delete the resource group (if you provisoned new one) ``az group delete -n $rg`` 


## Running in local mode (CSV generation)

To only generate CSV, you can run the tool in limited mode, which removes some basic analytic functions that are present in the Log Analytics query.

- Does not require Azure Subscription with storage account (Only AAD access is needed)
- Requires still Azure CLI and Node JS (+14) to be installed on the system this tool is run
  
    The limited mode returns following data in CSV

    ``app${delim}appID${delim}aadRole${delim}permissions${delim}danglingRedirect`` 

    ![](20230519165316.png)

    ![](20230519164812.png)
  

  - Changing the delimitter of the CSV you can run the tool as follows ``node main --delimitter=";"`` 





# Limitations

This tool supports paginated results for the initial batch creation. The later operations which are done by Native MS Graph JSON batching at this point do not look for paginated results. This means that if there is an app, that has more than 999 appRoleAssignments, it will only display the first 999 assignments that are granted for that app (technical limit of these assignments is 1500, so it is possible that some app has been given more than 999 assignments)
- Same applies for app that has more than 999 client secrets.

![image](https://user-images.githubusercontent.com/58001986/236419306-5ff03c15-bb47-4829-a93e-f6d5d6bd8fde.png)

https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits#azure-active-directory-limits


# Contribution
Feel free to open issue or pull requests
