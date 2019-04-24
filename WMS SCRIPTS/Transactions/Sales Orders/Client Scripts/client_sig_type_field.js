/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([],

    function () {
        //hard code the roles that will not get locked down

        function pageInit(context) {
            updateSigField(context);
        }

        function fieldChanged(context) {
            if(context.fieldId == "shipmethod"){
                updateSigField(context);
            }
            return;
        }

        function updateSigField(context){
            var currentRecord = context.currentRecord;
            var sigField = currentRecord.getField({
                fieldId: "custbody_wms_signature_type"
            });
            if (currentRecord.getText("shipmethod").indexOf("FedEx") > -1){
                sigField.isDisabled = false;
            } else {
                currentRecord.setValue("custbody_wms_signature_type", "");
                sigField.isDisabled = true;
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };
    }
);