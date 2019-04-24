/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime'], function (record, search, runtime) {
	function beforeSubmit(context) {

		if (runtime.executionContext === "WEBSTORE") {
			var transactionRecord = context.newRecord;
			var customerId = transactionRecord.getValue("entity");

			if (!customerId) {
				return;
			}
			var customerRecord = record.load({
				type: "customer",
				id: customerId,
				isDynamic: false,
				defaultValues: null
			});
			var customerEmails = customerRecord.getValue("custentity_transaction_emails").replace(/\s+/g, '').split(",").join(", "); //formats correctly
			var transactionEmails = transactionRecord.getValue("tobeemailed");

			if (customerEmails) {
				transactionRecord.setValue({
					fieldId: "email",
					value: customerEmails
				});
			}

		}

		return;
	}

	return {
		beforeSubmit: beforeSubmit
	};
})

