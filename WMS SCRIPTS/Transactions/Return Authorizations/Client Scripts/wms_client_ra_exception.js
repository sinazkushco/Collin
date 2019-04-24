/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 */

define([], function (){
    function setReturnMethodToNotApplicable(context) {
        if(context.fieldId === 'custbody_exempt_return') {
            var returnMethodMap = {
                fedExGround: 1,
                pickUpFromCustomer: 2,
                dropoffAtWarehouse: 3,
                notReturningItems: 4,
                customerResponsibility: 5,
                freight: 6,
                notApplicable: 7
            }
    
            var isExempt = context.currentRecord.getValue('custbody_exempt_return');
            if(isExempt) {
                var returnMethod = Number(context.currentRecord.getValue('custbody_returns_method'));
    
                if(returnMethod !== returnMethodMap.notReturningItems) {
                    context.currentRecord.setValue({
                        fieldId: 'custbody_returns_method',
                        value: returnMethodMap.notReturningItems
                    });
                }
            } else {
                context.currentRecord.setValue({
                    fieldId: 'custbody_returns_method',
                    value: ''
                });
            }
    
            return true;
        }
    }

    return {
        setReturnMethodToNotApplicable: setReturnMethodToNotApplicable
    }
});

