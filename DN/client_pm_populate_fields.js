/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function postSourcing_projectAutoFields(type, name) {
    try {
        if (name == "parent") {
            var customerId = nlapiGetFieldValue("parent");
            var TSM = nlapiLookupField("customer", customerId, "salesrep");
            var email = nlapiLookupField("customer", customerId, "email");
            nlapiSetFieldValue("custentity_pm_tsm", TSM);
            nlapiSetFieldValue("custentity_pm_contact_email", email);
        } 
    } catch (e) {
        // do nothing
    }
}

function fieldChanged_updateHiddenEmails(type, name, linenum){
    try{
        if (name == "custentity_pm_designer") {
            var designerId = nlapiGetFieldValue("custentity_pm_designer");
            var designerEmail = nlapiLookupField("employee", designerId, "email");
            nlapiSetFieldValue("custentity_pm_designer_email", designerEmail);
        } else if (name == "custentity_pm_tsm") {
            var tsmId = nlapiGetFieldValue("custentity_pm_tsm");
            var tsmEmail = nlapiLookupField("employee", tsmId, "email");
            nlapiSetFieldValue("custentity_pm_tsm_email", tsmEmail);
        } else if (name == "custentity_pm_project_manager") {
            var pmId = nlapiGetFieldValue("custentity_pm_project_manager");
            var pmEmail = nlapiLookupField("employee", pmId, "email");
            nlapiSetFieldValue("custentity_pm_pm_email", pmEmail);
        } else if (name == "custentity_sss") {
            var sssId = nlapiGetFieldValue("custentity_sss");
            var sssEmail = nlapiLookupField("employee", sssId, "email");
            nlapiSetFieldValue("custentity_pm_sss_email", sssEmail);
        }
    } catch (e){
        // do nothing
    }
}