/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = function (context) {
        var employeeDriverField = context.newRecord.getValue({
            fieldId: "custentity_isdriver"
        });
        var employeeWillCallField = context.newRecord.getValue({
            fieldId: "custentity_will_call_app_access"
        });
        var form = context.form;
        var employeeEmail = context.newRecord.getValue({ fieldId: "email" });
        if (employeeDriverField) {      
            form.clientScriptModulePath = "./client_dc_send_registration_email.js";
            form.addButton({
                functionName: "sendRegistrationEmail('" + employeeEmail + "')",
                id: "custpage_send_register_email",
                label: "Send Delivery Registration Email"
            });
        }
        if (employeeWillCallField) {
            form.clientScriptModulePath = "./client_dc_send_registration_email.js";
            form.addButton({
                functionName: "sendWillCallRegistrationEmail('" + employeeEmail + "')",
                id: "custpage_send_register__will_callemail",
                label: "Send Will Call Registration Email"
            });
        }
    };
});
