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
	returnObj.beforeLoad = remove_extra_send_emails;
	return returnObj;
}

function remove_extra_send_emails(context) {
	if (context.type == context.UserEventType.CREATE) {
		var currentRecord = context.newRecord;
		var email_list = currentRecord.getValue('shipnotifyemailaddressfedex');
		if (email_list) {
			LOG.debug('email list', email_list);
			var first_email = email_list.split(',')[0];
			LOG.debug('first email', first_email);
			currentRecord.setValue('shipnotifyemailaddressfedex', first_email);
			email_list = currentRecord.getValue('shipnotifyemailaddressfedex');
			LOG.debug('email list after set', email_list);
		}
	}
	return;
}

