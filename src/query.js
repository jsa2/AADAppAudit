module.exports = {
    query:`authorizationresources
    | where type == "microsoft.authorization/roleassignments"
    | where  tostring(properties.principalType) == "ServicePrincipal" 
    | where tostring( properties.createdBy) != ""
    | extend roleId = tostring(properties.roleDefinitionId)
    | join kind = inner (authorizationresources
    | where ['type'] has "roledefinitions"
    | distinct tostring(properties.roleName), ['id']) on $left.roleId == $right.['id']
    | extend combinedRole = pack('role',tostring(properties_roleName),'scope',tostring(properties.scope) )
    | summarize make_set(combinedRole) by tostring(properties.principalId)    
    `
}