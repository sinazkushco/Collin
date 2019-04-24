function initHideShowFields() {
    var recordType = nlapiGetRecordType();
    var recordId = nlapiGetRecordId();
    var brandedFields = ["custentity_pm_rerun", "custentity_pm_sample_required"];
    var brandedPlusFields = ["custentity_pm_special_features", "custentitypm_accessories", "custentity_pm_sample_deadline", "custentity_pm_custom_design_specs", "custentitypm_materials", "custentitypm_color", "custentitypm_finish", "custentitypm_tamper_evident_type", "custentity_pm_state_compliance", "custentity_pm_design_render_deadline", "custentity_pm_cust_req_delivery_date"];
    var hypercustomFields = ["custentity_pm_type_of_cannabis", "custentity_pm_special_features", "custentitypm_accessories", "custentity_pm_prototype_deadline", "custentitypm_size_dimensions", "custentitypm_materials", "custentitypm_color", "custentitypm_finish", "custentity_pm_vapor_seal", "custentity_pm_cr_type", "custentitypm_tamper_evident_type", "custentity_pm_state_compliance", "custentity_pm_design_render_deadline", "custentity_pm_cust_req_delivery_date"];
    var projectType;
    try {
        projectType = nlapiLookupField(recordType, recordId, "jobtype");
    } catch (e) {
        projectType = nlapiGetFieldValue("jobtype");
    }

    hideAllSpecificFields(brandedFields, brandedPlusFields, hypercustomFields);
    hideDocuSignButton(recordType, recordId);
    if (projectType) {
        showSpecificFields(brandedFields, brandedPlusFields, hypercustomFields, projectType, recordType, recordId);
    }

    return;
}

function hideAllSpecificFields(brandedFields, brandedPlusFields, hypercustomFields) {
    var otherFields = ["custentity_pm_design_plans"];

    for (var i = 0; i < otherFields.length; i++) {
        nlapiGetField(otherFields[i]).setDisplayType("hidden");
    }
    for (var i = 0; i < brandedFields.length; i++) {
        nlapiGetField(brandedFields[i]).setDisplayType("hidden");
    }
    for (var i = 0; i < brandedPlusFields.length; i++) {
        nlapiGetField(brandedPlusFields[i]).setDisplayType("hidden");
    }
    for (var i = 0; i < hypercustomFields.length; i++) {
        nlapiGetField(hypercustomFields[i]).setDisplayType("hidden");
    }
}

function hideDocuSignButton(recordType, recordId) {
    var projectStatus;
    try {
        projectStatus = nlapiLookupField(recordType, recordId, "custentity_pm_status");
    } catch (e) {
        projectStatus = nlapiGetFieldValue("custentity_pm_status");
    }

    if(projectStatus !== "3" && projectStatus !== "4" && projectStatus !== "6" && projectStatus !== "9"){
        jQuery("#tbl_custpage_button_docusign_send").parent().hide();
        jQuery("#custpage_button_docusign_sign").parent().hide();
    }
}

function showSpecificFields(brandedFields, brandedPlusFields, hypercustomFields, projectType, recordType, recordId) {
    console.log("show specific fields called");
    if (projectType == "1") { //TODO: Confirm Production Values
        for (var i = 0; i < brandedFields.length; i++) {
            nlapiGetField(brandedFields[i]).setDisplayType("normal");
        }
    } else if (projectType == "2") {
        for (var i = 0; i < brandedPlusFields.length; i++) {
            nlapiGetField(brandedPlusFields[i]).setDisplayType("normal");
        }
    } else if (projectType == "3") {
        for (var i = 0; i < hypercustomFields.length; i++) {
            nlapiGetField(hypercustomFields[i]).setDisplayType("normal");
        }
    }

    var artworkField;
    try {
        artworkField = nlapiLookupField(recordType, recordId, "custentity_artwork_status");
    } catch (e) {
        artworkField = nlapiGetFieldValue("custentity_artwork_status");
    }
    if (artworkField == "1") {
        nlapiGetField("custentity_pm_design_plans").setDisplayType("hidden");
        // nlapiGetField("custentity_pm_design_hours_required").setDisplayType("normal");
        // nlapiGetField("custentity_pm_design_hours_required").setDisplayType("disabled");
    } else if (artworkField == "2") {
        nlapiGetField("custentity_pm_design_plans").setDisplayType("normal");
        //nlapiGetField("custentity_pm_design_hours_required").setDisplayType("hidden");
        //nlapiSetFieldMandatory("custentity_pm_design_plans", true);  //has to be last item, breaks everything under

    }
}

initHideShowFields();