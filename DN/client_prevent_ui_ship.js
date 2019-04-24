/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/runtime"], function (require, exports, log, runtime) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = function (context) {
        if (runtime.executionContext == 'USERINTERFACE' && context.type == context.UserEventType.VIEW) {
            var ship_status = context.newRecord.getValue({fieldId: "shipstatus"});
            var delivery_driver = context.newRecord.getValue({fieldId: "custbody_deliverydriver"});

            if(ship_status == "B" && delivery_driver){
                var field = context.form.addField({
                    id: 'custpageinjectcode',
                    type: 'INLINEHTML',
                    label: 'Inject Code'
                });
                field.defaultValue = "<script>jQuery(\"#markpacked\").attr(\"onclick\", \"alert('This order can only be marked shipped through the Kush Bottles Delivery App by the delivery driver.')\");</script>";
            }

            // var role = runtime.getCurrentUser().role;
            // var picking_ticket_pulled = context.newRecord.getValue({
            //     fieldId: 'custbody_pick_ticket_printed'
            // });
            // log.debug('role', role);
            // log.debug('picking ticket', picking_ticket_pulled);
            // //1006 sales person
            // if (picking_ticket_pulled && role == '3') {
            //     var field = context.form.addField({
            //         id: 'custpageinjectcode',
            //         type: 'INLINEHTML',
            //         label: 'Inject Code'
            //     });
            //     //Hide the edit button in view 
            //     field.defaultValue = "<script>function hide_edit_button(){jQuery('#tr_edit').parent().parent().parent().hide();} hide_edit_button();</script>"; //This is where you would type your script
            //     // form.addButton({
            //     //     functionName: `sendRegistrationEmail('${employeeEmail}')`,
            //     //     id: `custpage_send_register_email`,
            //     //     label: `Send Delivery Registration Email`
            //     // });
            // }
        }
    };
});