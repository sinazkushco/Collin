/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define(['N/runtime'], function (runtime) {
    function beforeLoad(context) {
        var form = context.form;
        var newRecord = context.newRecord;
        var type = context.type;
        var userRole = Number(runtime.getCurrentUser().role);

        if(type === context.UserEventType.CREATE || type === context.UserEventType.EDIT || type === context.UserEventType.VIEW) {
            var orderStatus = newRecord.getValue('orderstatus');
            var shipmethod = Number(newRecord.getValue('shipmethod'));
            var roleWhitelist = {
                3: 'Administrator',
                1101: 'Sales Ops Director - KSC',
                1100: 'Sales Ops Manager - KSC',
                1102: 'Sales Ops Specialist -KSC',
            };
            
            if(
                roleWhitelist[userRole] &&
                (orderStatus === 'E' || orderStatus === 'F') &&
                shipmethod === 5209
            ) return;

            form.removeButton({ id: 'return' });
        }
    }
     
    return {
        beforeLoad: beforeLoad
    };
});
 
