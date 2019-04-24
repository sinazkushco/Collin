/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/runtime", "N/redirect"], function (require, exports, log, runtime, redirect) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            var role = runtime.getCurrentUser().role.toString();
            var user = runtime.getCurrentUser().id.toString();
            var picking_ticket_pulled = context.newRecord.getValue({
                fieldId: 'custbody_locations_picked'
            });
            var allowed_roles = ['1008', '1054', '3', '1048']; //warehouse manager, director of operations, administrator
            var allowed_user_ids = ['8510', '528', '1012608', '46336', '507527', '9176', '172124', '1147284']; //Adrien Anaya, Jonathan Huang, Pamela Chavez, Pamela Glines, Ryan Jue, Reed Longstreth, Dennis Nguyen, olivia
            log.debug('role', role);
            log.debug('picking ticket', picking_ticket_pulled);
            if (context.type == context.UserEventType.VIEW) {
                if (picking_ticket_pulled.length && (allowed_roles.indexOf(role) == -1 && allowed_user_ids.indexOf(user)) == -1) {
                    var hide_edit = context.form.addField({
                        id: 'custpage_hide_edit_button',
                        type: 'INLINEHTML',
                        label: 'hide edit'
                    });
                    //Hide the edit button in view 
                    hide_edit.defaultValue = "<style> #tbl_edit, #tbl_secondaryedit { display : none;} </style>"; //This is where you would type your script
                    var alert_hide_edit = context.form.addField({
                        id: 'custpage_alert_hide_edit',
                        type: 'INLINEHTML',
                        label: 'alert fulfillment'
                    });
                    alert_hide_edit.defaultValue = "<script> alert('You cannot edit a sales order while it is being fulfilled'); </script>";
                }
            }
            else if (context.type == context.UserEventType.EDIT) {
                if (picking_ticket_pulled.length && allowed_roles.indexOf(role) == -1 && allowed_user_ids.indexOf(user) == -1) {
                    log.debug('SO id', context.newRecord.id);
                    redirect.toRecord({
                        type: 'salesorder',
                        id: context.newRecord.id.toString(),
                        isEditMode: false
                    });
                }
            }
        }
    };
});
