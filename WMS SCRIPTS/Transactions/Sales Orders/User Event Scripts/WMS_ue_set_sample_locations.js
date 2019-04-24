/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define([], runUserEvent);
 
function runUserEvent() {
    function beforeLoad(context) {
        var rec = context.newRecord;
        var formType = Number(rec.getValue('customform'));

        if(formType === 169){ // KB Sample Sales Order
            rec.setValue({
                fieldId: 'custbody_sample_order', 
                value: true
            });
        }
    }
     
    function beforeSubmit(context) {
        var rec = context.newRecord;
        var formType = Number(rec.getValue('customform'));

        if(formType == 169) { // KB Sample Sales Order
            // Set location to sample location
            var sampleLocation = rec.getValue('custbody_sample_location');
            rec.setValue({
                fieldId: 'location', 
                value: sampleLocation
            });

            // Ensures this is flagged as a sample order
            rec.setValue({
                fieldId: 'custbody_sample_order', 
                value: true
            }); 
        }
        return true;
    }

	return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
}