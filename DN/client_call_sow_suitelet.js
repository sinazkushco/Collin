function createSOW() {
    try {
        //call the suitelet
        var createdPdfUrl = nlapiResolveURL('SUITELET', 'customscript_suitelet_pm_create_sow', 'customdeploy_suitelet_pm_create_sow_depl', false);
        //pass the internal id of the current record
        createdPdfUrl += '&id=' + nlapiGetRecordId();

        //show the PDF file
        newWindow = window.open(createdPdfUrl);
    } catch (exception) {
        //alert("Error: " + exception);
    }
}

function attachToDocuSignButton(type) {
    var recordType = nlapiGetRecordType();
    var recordId = nlapiGetRecordId();
    var currentStatus = nlapiLookupField(recordType, recordId, "custentity_pm_status");
    var docuSignFunction = jQuery("#custpage_button_docusign_send").attr("onclick");

    if (currentStatus == "3" || currentStatus == "4") { //Project Review
        var estimate = nlapiLookupField(recordType, recordId, "custentity_pm_estimate_record");
        var salesOrder = nlapiLookupField(recordType, recordId, "custentity_pm_sales_order_record");
        if (!estimate && !salesOrder) {
            jQuery("#custpage_button_docusign_send").attr("onclick", "alert('Please attach an estimate or sales order to this project.')");
            return;
        }
        docuSignFunction = 'createSOW(); updateStatusAfterDocuSign(' + currentStatus + '); ' + docuSignFunction;
        jQuery("#custpage_button_docusign_send").attr("onclick", docuSignFunction);
    } else if (currentStatus == "6" || currentStatus == "9") { //In Pre-Flight
        docuSignFunction = 'clearSOW(); updateStatusAfterDocuSign(' + currentStatus + '); ' + docuSignFunction;
        jQuery("#custpage_button_docusign_send").attr("onclick", docuSignFunction);
    }

}

//SOW SENT - Puts status at Awaiting Customer Approval
function updateStatusAfterDocuSign(status) {
    var recordType = nlapiGetRecordType();
    var recordId = nlapiGetRecordId();
    if (status == "3" || status == "4") { //Product Review
        nlapiSubmitField(recordType, recordId, "custentity_pm_status", "4"); //Awaiting Customer Approval
    } else if (status == "6" || status == "9") { //In Pre-Flight
        nlapiSubmitField(recordType, recordId, "custentity_pm_status", "9"); //Awaiting Proof Approval
    }
}
function clearSOW() {
    try {
        //call the suitelet
        var clearSowUrl = nlapiResolveURL('SUITELET', 'customscript_suitelet_pm_create_sow', 'customdeploy_suitelet_pm_create_sow_depl', false);
        //pass the internal id of the current record
        clearSowUrl += '&id=' + nlapiGetRecordId() + '&action=clearSOW';
        
        $.get(clearSowUrl, function (data) {
            // console.log(data);
        });
    } catch (exception) {
        //alert("Error: " + exception);
    }
    

}

attachToDocuSignButton();