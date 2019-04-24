function update_records(recordType, recordID) {
    var designerId = nlapiLookupField(recordType, recordID, "custentity_pm_designer");
    var tsmId = nlapiLookupField(recordType, recordID, "custentity_pm_tsm");
    var pmId = nlapiLookupField(recordType, recordID, "custentity_pm_project_manager");
    var sssId = nlapiLookupField(recordType, recordID, "custentity_sss");
    nlapiLogExecution("AUDIT", "ids", pmId);
    if (designerId) {
        var designerEmail = nlapiLookupField("employee", designerId, "email");
        nlapiSubmitField(recordType, recordID, "custentity_pm_designer_email", designerEmail);
    }
    if (tsmId) {
        var tsmEmail = nlapiLookupField("employee", tsmId, "email");
        nlapiSubmitField(recordType, recordID, "custentity_pm_tsm_email", tsmEmail);

    }
    if (pmId) {
        var pmEmail = nlapiLookupField("employee", pmId, "email");
        nlapiSubmitField(recordType, recordID, "custentity_pm_pm_email", pmEmail);
    }

    if (sssId) {
        var sssEmail = nlapiLookupField("employee", sssId, "email");
        nlapiSubmitField(recordType, recordID, "custentity_pm_sss_email", sssEmail);
    }
}