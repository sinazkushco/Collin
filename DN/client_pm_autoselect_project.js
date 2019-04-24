/** fires when you insert a line into an edit sublist
 * @param type      string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function validateLine_autoProject(type) {
    try {
        var project = nlapiGetCurrentLineItemValue("item", "custcol_project");
        var itemId = nlapiGetCurrentLineItemValue("item", "item");
        var itemCustomer = nlapiGetCurrentLineItemValue("item", "custcol_item_customer");
        var customerId = nlapiLookupField("item", itemId, "custitem_customer");

        //project field is empty - searches for a project. If one project found - will auto populate, more than one will do nothing
        if (!project && customerId) {
            var projectId = searchForProjects(customerId);
            if (projectId) {
                nlapiSetCurrentLineItemValue("item", "custcol_project", projectId);
                project = true;
            }
        }

        //if item has a customer attached, then a project is also needed
        if (itemCustomer && !project) {
            alert("The project field cannot be empty for items with customers.");
            return false;
        }
        return true;
    } catch (e) {
        nlapiLogExecution("debug", "failed", "auto populate project on PO failed");
    }
}

//TODO: Change status noneof value to all the correct values - to be updated
function searchForProjects(customerId) {
    var projectSearch = nlapiSearchRecord("job", null, [
        ["status", "noneof", "36"],
        "AND", ["customer", "anyof", customerId]
    ], [
        new nlobjSearchColumn("internalid"),
        new nlobjSearchColumn("altname")
    ]);

    if (projectSearch) {
        if (projectSearch.length == 1) {
            return projectSearch[0].getValue("internalid");
        } else {
            return false;
        }
    } else {
        return false;
    }

}