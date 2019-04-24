/**
 * @NAPIVersion 2.0
 * @NScriptType ClientScript
 */
define(["require", "exports", "N/log"], function (require, exports, log) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.saveRecord = function (context) {
        try {
            var currentRecord = context.currentRecord;
            var email_list = currentRecord.getValue("email");
            if (email_list) {
                var first_email = email_list.split(",")[0];
                currentRecord.setValue("email", first_email);
            }
        }
        catch (e) {
            log.debug("error", e);
        }
        return true;
    };
});
