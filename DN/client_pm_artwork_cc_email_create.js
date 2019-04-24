/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function fieldChanged_updateArtworkStatusEmail(type, name, linenum) {
    var subsidiary = nlapiGetFieldValue("subsidiary");
    if (subsidiary == "1") {
        if (name == "custentity_pm_project_manager") {
            var projectManagerID = nlapiGetFieldValue("custentity_pm_project_manager");
            if (projectManagerID) {
                var projectManagerEmail = nlapiLookupField("employee", projectManagerID, "email");
                var emailList = projectManagerEmail + ",design@kushbottles.com";
                nlapiSetFieldValue("custentity_pm_artwork_status_email_list", emailList);
            } else {
                nlapiSetFieldValue("custentity_pm_artwork_status_email_list", "design@kushbottles.com");
            }
        }
        if (name == "custentity_sss") {
            var sssId = nlapiGetFieldValue("custentity_sss");
            if (sssId) {
                var sssEmail = nlapiLookupField("employee", sssId, "email");
                var ccEmailField = nlapiGetFieldValue("custentity_pm_cc_email_list");
                if (!ccEmailField) {
                    nlapiSetFieldValue("custentity_pm_cc_email_list", sssEmail);
                } else if (ccEmailField) {
                    var newEmailField = ccEmailField.split(",");
                    if (newEmailField.indexOf(sssEmail) == -1) {
                        newEmailField.push(sssEmail);
                        nlapiSetFieldValue("custentity_pm_cc_email_list", newEmailField.join(","));
                    }
                }
            }
        }
    }

}