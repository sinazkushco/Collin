var LOG;
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(['N/log'], only_first_email);

function only_first_email(log) {
	LOG = log;
	var returnObj = {};
	returnObj.beforeSubmit = remove_extra_send_emails;
	return returnObj;
}

function remove_extra_send_emails(context) {
    log.debug("remove extra send emails function beginning", "called");
    try {
        if (context.type === context.UserEventType.CREATE) {
            log.debug("condition met", "context.type === context.UserEventType.CREATE");
            var currentRecord = context.newRecord;
            var email_list = currentRecord.getValue("email");
            if (email_list) {
                log.debug("condition met", "email_list");
                var first_email = email_list.split(",")[0];
                currentRecord.setValue("email", first_email);
            }
        }
    }
    catch (e) {
        LOG.debug("error", e);
    }
	return;
}