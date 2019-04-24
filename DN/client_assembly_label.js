/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define([], runClientscript);

function runClientscript() {

    //*********** HELPER FUNCTIONS ***********

    function saveRecord(context) {
        var currentRecord = context.currentRecord;

        if (Number(currentRecord.getValue("custpage_number_of_cases")) > 99) {
            var submissionConfirmed = confirm("Please Confirm The Number Of Cases, Press OK To Proceed");

            return submissionConfirmed; // True False
        }

        return true;
    }

    var returnObj = {};
    returnObj.saveRecord = saveRecord;
    return returnObj;
}