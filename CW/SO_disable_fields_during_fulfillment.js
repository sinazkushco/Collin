/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/runtime", "N/ui/serverWidget"], function (require, exports, log, runtime, server_widget) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = function (context) {
        var role = runtime.getCurrentUser().role;
        var fields_to_disable = ['shipdate', 'entity', 'shipto', 'shipmethod']; //shipmethod, shipaddress, billaddress
        log.debug('role', role);
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE && context.type == context.UserEventType.EDIT && role !== 3) {
            var new_record = context.newRecord;
            var status_1 = new_record.getValue('status');
            if (status_1 == 'Pending Fulfillment') {
                var locations_picked = new_record.getValue('custbody_locations_picked');
                log.debug('locations_picked', JSON.stringify(locations_picked));
                if (locations_picked && locations_picked.length) {
                    log.debug('disabling fields', 'DENIED');
                    for (var i = 0; i < fields_to_disable.length; i++) {
                        var form_field = context.form.getField(fields_to_disable[i]);
                        form_field.updateDisplayType({ displayType: server_widget.FieldDisplayType.DISABLED });
                    }
                }
            }
        }
    };
});
