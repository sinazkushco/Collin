/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function fieldChanged_projectType(type, name, linenum) {
    var subsidiary = nlapiGetFieldValue("subsidiary");

    if(subsidiary != "1"){
        return;
    }

    var projectType = nlapiGetFieldValue("jobtype");
    if (name == "jobtype") {
        hideAllSpecificFields_edit(); // hides all fields
        showSpecificFields_edit(projectType);
    } 
    else if (name == "custentity_artwork_status") {
        var artworkStatus = nlapiGetFieldValue("custentity_artwork_status");
        if(artworkStatus == "1") {
            nlapiGetField("custentity_pm_design_plans").setDisplayType("hidden");
            nlapiGetField("custentity_pm_design_hours_required").setDisplayType("normal");
            nlapiGetField("custentity_pm_design_hours_required").setDisplayType("disabled");
            nlapiSetFieldValue("custentity_pm_design_plans","");
        } else if (artworkStatus == "2"){
            nlapiGetField("custentity_pm_design_plans").setDisplayType("normal");
            // nlapiSetFieldMandatory("custentity_pm_design_plans", true);
            nlapiGetField("custentity_pm_design_hours_required").setDisplayType("hidden");
            nlapiSetFieldValue("custentity_pm_design_plans","");
            //nlapiSetFieldValue("custentity_pm_additional_design_hours","");
        }
    }

    return;
}

/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function saveRecord_projectType() {

    var subsidiary = nlapiGetFieldValue("subsidiary");

    if(subsidiary != "1"){
        return true;
    }

    var submitRequiredFields = checkRequired_edit();
    var kbCreatingArtwork = nlapiGetFieldValue("custentity_artwork_status") == 2;
    var designPlan = nlapiGetFieldValue("custentity_pm_design_plans");

    
    // if(kbCreatingArtwork && !designPlan) {
    //     alert("Please complete the design plan fields.");
    //     return false;
    // }
    if (!submitRequiredFields.readyToSubmit && submitRequiredFields.projectType == "2") { //branded+
        alert("Please complete the Product and Product Description fields.");
        return false;
    } else if (!submitRequiredFields.readyToSubmit && submitRequiredFields.projectType == "1") { //branded
        alert("Please complete the Product field");
        return false;
    }
    //clearDesignHours();
    updateDesignHoursRequired_edit();
    return true;
}

function hideAllSpecificFields_edit() {
    var brandedFields = ["custentity_pm_rerun", "custentity_pm_sample_required"];
    var brandedPlusFields = ["custentity_pm_special_features", "custentitypm_accessories", "custentity_pm_sample_deadline", "custentity_pm_custom_design_specs", "custentitypm_materials", "custentitypm_color", "custentitypm_finish", "custentitypm_tamper_evident_type", "custentity_pm_state_compliance", "custentity_pm_design_render_deadline", "custentity_pm_cust_req_delivery_date"];
    var hypercustomFields = ["custentity_pm_type_of_cannabis", "custentity_pm_special_features", "custentitypm_accessories", "custentity_pm_prototype_deadline", "custentitypm_size_dimensions", "custentitypm_materials", "custentitypm_color", "custentitypm_finish", "custentity_pm_vapor_seal", "custentity_pm_cr_type", "custentitypm_tamper_evident_type", "custentity_pm_state_compliance", "custentity_pm_design_render_deadline", "custentity_pm_cust_req_delivery_date"];
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

function showSpecificFields_edit(projectType) {
    var brandedFields = ["custentity_pm_rerun", "custentity_pm_sample_required"];
    var brandedPlusFields = ["custentity_pm_special_features", "custentitypm_accessories", "custentity_pm_sample_deadline", "custentity_pm_custom_design_specs", "custentitypm_materials", "custentitypm_color", "custentitypm_finish", "custentitypm_tamper_evident_type", "custentity_pm_state_compliance", "custentity_pm_design_render_deadline", "custentity_pm_cust_req_delivery_date"];
    var hypercustomFields = ["custentity_pm_type_of_cannabis", "custentity_pm_special_features", "custentitypm_accessories", "custentity_pm_prototype_deadline", "custentitypm_size_dimensions", "custentitypm_materials", "custentitypm_color", "custentitypm_finish", "custentity_pm_vapor_seal", "custentity_pm_cr_type", "custentitypm_tamper_evident_type", "custentity_pm_state_compliance", "custentity_pm_design_render_deadline", "custentity_pm_cust_req_delivery_date"];
    if (projectType == "1") {
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
}

function checkRequired_edit() {
    var projectType = nlapiGetFieldValue("jobtype");
    var brandedFields = ["custentitypm_product"];
    //var brandedPlusFields = ["custentity_pm_product_description"];
    var readyToSubmit = true;
    var fieldValue;

    if (projectType == "1") { //branded
        for (i = 0; i < brandedFields.length; i++) {
            fieldValue = nlapiGetFieldValue(brandedFields[i]);
            if (!fieldValue) {
                readyToSubmit = false;
            }
        }
    }

    // if (projectType == "2") { //branded+
    //     for (i = 0; i < brandedPlusFields.length; i++) {
    //         fieldValue = nlapiGetFieldValue(brandedPlusFields[i]);
    //         if (!fieldValue) {
    //             readyToSubmit = false;
    //         }
    //     }
    // }
    return {
        readyToSubmit: readyToSubmit,
        projectType: projectType
    };

}

function updateDesignHoursRequired_edit(){
    var addHours = nlapiGetFieldValue("custentity_pm_additional_design_hours");
    if(addHours){
        nlapiSetFieldValue("custentity_pm_design_hours_required", addHours);
    } else {
        nlapiSetFieldValue("custentity_pm_design_hours_required", "");
    }
}

// function clearDesignHours(){
//     var designCheckFields = ["custentity_pm_correct_kb_dielines", "custentity_pm_color_codes_provided", "custentity_pm_cmyk_doc_mode", "custentitypm_vector_based_art", "custentity_pm_300_dpi", "custentitypm_all_text_outlined", "custentity_pm_inch_bleed_included", "custentity_pm_components_art_layer", "custentity_pm_dielines_banding_not_mod", "custentity_pm_substrate_correct", "custentitypm_finish_correctly_indicated"];
//     var allChecked = true;
//     for(var i = 0; i < designCheckFields.length; i++){
//         var fieldVal = nlapiGetFieldValue(designCheckFields[i]);
//         if(fieldVal == "F"){
//             allChecked = false;
//         }
//     }
//     if(allChecked){
//         nlapiSetFieldValue("custentity_pm_additional_design_hours", "");
//     }
// }