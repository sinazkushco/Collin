
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */



define(['N/runtime', 'N/log', 'N/record', 'N/search', '../WMS SCRIPTS/Libraries/global_modules.js'],
    function (runtime, log, record, search, gm) {
        function beforeSubmit(context) {

            //get current record
            var currentRecord = context.newRecord;

            //get value of 'status' field
            var terms = currentRecord.getValue({
                fieldId: 'terms'
            });

            var autoApplyCheckbox = currentRecord.getValue({
                fieldId: 'automaticallyapplypromotions'
            })

            if(!terms || terms == "8" ){
                var promotionCount = context.currentRecord.getLineCount({
                    sublistId: 'promotions'
                })
                for(var i = 0; i<promotionCount; i++){
                    var promotion = currentRecord.getSublistValue({
                        sublistId: 'promotions',
                        fieldId: 'couponcode_display',
                        line: i,
                    });

                    if(promotion == 'creditcharge'){
                        currentRecord.removeLine({
                            sublistId: 'promotions',
                            line: i,
                            ignoreRecalc: true
                        });
                    }
                    
                }
            }
            return true;
        }

        return { beforeSubmit: beforeSubmit };
    })




