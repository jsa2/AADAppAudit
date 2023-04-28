

# Azure AD Application Analytics Solution

Major Refactor of previous [solution](https://github.com/jsa2/CloudShellAadApps/tree/public#consent-and-azure-ad-application-analytics-solution) 
 - You can read about some of the use cases in the previous solutions documentation [solution](https://github.com/jsa2/CloudShellAadApps/tree/public#consent-and-azure-ad-application-analytics-solution) 

# Before using this tool 
Read the [MIT license](LICENSE)

⚠ Only use this tool if you know what you are doing and have reviewed the code

⚠ Always test the tool first in test environments with non-sensitive data

# Release notes

    Beta v 0.1.0
    - Compared to previous version uses now JSON batching and larger resultsize across all queries. 2-3x faster than the previous version
    - Release for Azure Security meetup UG


**Solution to enrich information about servicePrincipals**

Aim is to enable users to define their own analytics rules, while providing [blazing fast](https://learn.microsoft.com/en-us/graph/json-batching) data collection and enrichment of [servicePrincipal](https://learn.microsoft.com/en-us/azure/active-directory/develop/active-directory-how-applications-are-added) objects

**Major performance improvement with JSON batching**
![](20230428144229.png)

## List of checks 

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


# Requirements and operation

Access to Azure Cloud Shell (Bash)
- Permissions to [create](#provision-new) new storage account or to use [existing](#use-existing-storage-account) one.
- Access to Log Analytics workspace 
- Azure CLI installed (this get tokens from the underlying Azure CLI installation)
  
| Requirement                                                    | description                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ Access to Azure Cloud Shell Bash                             | Uses pre-existing software on Azure CLI, Node etc                                                                                                                                                                                                                                                                                                     |
| ✅ Permissions to Azure subscription to create needed resources | Tool creates a storage account and a resource group. Possible also to use existing storage account. In both scenarios tool generates short lived read-only shared access links (SAS) for the ``externalData()`` -[operator](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/externaldata-operator?pivots=azuredataexplorer#examples) |
| ✅ User is Azure AD member                                      | Cloud-only preferred with read-only Azure AD permissions. More permissions are needed if sign-in events are included                                                                                                                                                                                                                                  |
| ✅ Existing Log Analytics Workspace                             | This is where you paste the output from this tool                                                                                                                                                                                                                                                                                                     |


 **About the generated KQL**
- The query is valid for 10 minutes, as SAS tokens are only generated for 10 minutes

## Use existing storage account
```sh 
storageAcc=dogs
rg=queryStorage-29991
location=westeurope
az storage account show-connection-string -g $rg  -n  $storageAcc -o json  > src/config.json
```
## Provision new 
```sh 
rnd=$RANDOM
rg=queryStorage-$rnd
location=westeurope
# You can ignore the warning "command substitution: ignored null byte in input"
storageAcc=storage$(head /dev/urandom | tr -dc a-z | head -c10)

echo $storageAcc
# Create Resource Group
az group create -n $rg \
-l $location \
--tags="svc=scan"


# Create storageAcc Account 
az storage account create -n $storageAcc  -g $rg --kind storageV2 -l $location -t Account --sku Standard_LRS

az storage account show-connection-string -g $rg  -n  $storageAcc -o json  > src/config.json
# Creates retention policy
az storage account management-policy create --account-name $storageAcc  -g $rg --policy @retention.json
  ```

## Operation

If you are running the tool in Azure Cloud Shell then all depedencies are already installed



```sh

git clone https://github.com/jsa2/AADAppAudit

cd AADAppAudit

npm install

node main 

# paste the code in runtime.kql to the desired log analytics worspace
# "navigate to kql/runtime.kql if code does not open up



```
**Run the pasted query in the workspace**

![](20230428145234.png)

## After running the tool

- Remove installation of this service (removes the json files that were stored for the query)
- Delete the resource group (if you provisoned new one) ``az group delete -n $rg`` 


# Contribution
Feel free to open issue or pull requests