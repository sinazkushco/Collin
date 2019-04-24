/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define([], runClientscript);

function runClientscript() {

    //*********** HELPER FUNCTIONS ***********
    function fieldChanged(context) {
        if (context.fieldId == "custpage_bin_location" || context.fieldId == "custpage_include_tomorrow" || context.fieldId == "custpage_start_date") {
            var locationField = context.currentRecord.getValue("custpage_bin_location");
            var tomorrowField = context.currentRecord.getValue("custpage_include_tomorrow");
            var startDateField = context.currentRecord.getText("custpage_start_date");
            var suiteletUrl = "https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=798&deploy=1";

            if (locationField == "1" || locationField == "2") { // Chapman
                suiteletUrl += "&location=" + locationField;
            }
            if (tomorrowField == true) {
                suiteletUrl += "&includetomorrow=" + tomorrowField;
            }
            if (startDateField){
                suiteletUrl += "&startdate=" + startDateField;
            }
            
            window.onbeforeunload = null; // Removes Reload Page Alert
            window.location.replace(suiteletUrl);

        }
        return;
    }

    function saveRecord(context) {
        var isChecked = false;
        var currentRecord = context.currentRecord;

        //Get Line Item Count

        var lineCount = currentRecord.getLineCount("bin_sublist");

        if (lineCount > 0) {

            for (var line = 0; line < lineCount; line++) {

                //Get Select Checkbox value

                isChecked = currentRecord.getSublistValue({
                    sublistId: "bin_sublist",
                    fieldId: "custpage_checkmark",
                    line: line
                });

                if (isChecked === true) {

                    break;

                }

            }

            if (isChecked === false) {

                alert("Please Select an Item.");
                return false;

            }

        } else if (lineCount == 0) {

            alert("No Items to Submit.");
            return false;
        }

        var submissionConfirmed = confirm("Please Confirm Items, Press OK To Proceed");

        return submissionConfirmed; // True False
    }

    function refreshPage() {
        location.reload();
    }

    function printPage() {
        window.print();
    }

    var returnObj = {};
    returnObj.fieldChanged = fieldChanged;
    returnObj.saveRecord = saveRecord;
    returnObj.refreshPage = refreshPage;
    returnObj.printPage = printPage;
    return returnObj;
}