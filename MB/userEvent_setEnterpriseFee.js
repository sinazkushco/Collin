
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */



define(['N/runtime', 'N/log', 'N/record', 'N/search'],
    function (runtime, log, record, search) {
        function afterSubmit(context) {

            //get current record
            var currentRecord = context.newRecord;
            var recordId = currentRecord.id;

            //get value of 'subtotal' field
            var orderTotal = currentRecord.getValue({
                fieldId: 'subtotal'
            });
            

            var enterpriseFeeExists = false; 
            var promotionLineCount = currentRecord.getLineCount({
                sublistId: 'promotions'
            });

            if(promotionLineCount){ 
                for(var i = 0; i<promotionLineCount; i++){
                    var currentPromoCode = currentRecord.getSublistValue({
                        sublistId: 'promotions',
                        fieldId: 'promocode',
                        line: i,
                    });
                    currentPromoCode = Number(currentPromoCode);
                    if(currentPromoCode == 129){
                        enterpriseFeeExists = true;
                    }
                }
            }

            if(orderTotal && enterpriseFeeExists){ 
                var enterpriseFee = orderTotal * .05;
                enterpriseFee = enterpriseFee.toFixed(2)
                
                record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: recordId,
                    values: {
                        custbody_calculated_enterprise_fee : enterpriseFee
                    }
    
                })
    
                return true;
            }
        }

        return { afterSubmit: afterSubmit };
    })




