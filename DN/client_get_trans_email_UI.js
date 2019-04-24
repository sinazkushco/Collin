/**
 *@NApiVersion 2.x
 *@NModuleScope SameAccount
 *@NScriptType ClientScript
 */
define(['N/record', 'N/log', 'N/search', 'N/runtime'], function (record, log, search, runtime) {
    function pageInit(context) {
        //only applies to create record
        if (context.mode === 'create') {
            updateTransactionField(context);
        }
    }

    function postSourcing(context) {
        //only applies to customer field
        if (context.fieldId === "entity") {
            updateTransactionField(context);
        }
    }

    function updateTransactionField(context) {
        try {
            if (runtime.executionContext == "USERINTERFACE") {
                var transactionRecord = context.currentRecord;
                var customerId = transactionRecord.getValue("entity");
                if (customerId) {
                    var customerRecord = search.lookupFields({
                        type: "customer",
                        id: customerId,
                        columns: ['custentity_transaction_emails']
                    });
                    // var customerRecord = record.load({
                    // 	type: "customer",
                    // 	id: customerId,
                    // 	isDynamic: false,
                    // 	defaultValues: null
                    // });
                    var customerEmails = customerRecord.custentity_transaction_emails.replace(/\s+/g, '').split(",").join(", "); //formats correctly
                    // var customerEmails = customerRecord.getValue("custentity_transaction_emails").replace(/\s+/g, '').split(",").join(", "); //formats correctly
                    if (customerEmails) {
                        transactionRecord.setValue({
                            fieldId: "email",
                            value: customerEmails
                        });
                    }
                }
            }
        } catch (e){
            // do nothing
        }
    }

    var returnObj = {};
    returnObj.postSourcing = postSourcing;
    returnObj.pageInit = pageInit;
    return returnObj;
});