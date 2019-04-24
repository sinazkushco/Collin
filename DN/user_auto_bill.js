var search, record, log, moment, email, render, https, cred, runtime;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/search", "N/record", "N/log", "../Library/moment", "N/email", "N/render", "N/https", "/SuiteScripts/CW/credentials2.0.js", "N/runtime"], runUserEvent);

function runUserEvent(SEARCH, RECORD, LOG, MOMENT, EMAIL, RENDER, HTTPS, CRED, RUNTIME) {
    search = SEARCH;
    log = LOG;
    record = RECORD;
    moment = MOMENT;
    email = EMAIL;
    render = RENDER;
    https = HTTPS;
    cred = CRED;
    runtime = RUNTIME;

    var returnObj = {};
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}

function afterSubmit(context) {
    var type = context.type;

    if (type != "create" && type != "ship") {
        return;
    }

    var shipstatus = context.newRecord.getValue("shipstatus");
    if (type == "ship" || type == "create" && shipstatus == "C") {
        try {
            initAutoBillCheck(context.newRecord);
        } catch (e) {
            email.send({
                author: 172124, //id of sender
                recipients: [172124], //array of ids, can be numbers or strings
                subject: "Auto Bill Error - " + context.newRecord.getText("createdfrom") + " | " + context.newRecord.getValue("tranid"),
                body: e
            });
        }

    }
    return;
}

function initAutoBillCheck(itemFulRecord) {
    var deliveryDriverExist = itemFulRecord.getValue("custbody_deliverydriver");

    if (deliveryDriverExist) {
        return;
    }

    var soId = itemFulRecord.getValue("createdfrom");

    // stops function if transfer order
    if (itemFulRecord.getText("createdfrom").indexOf("Sales Order") == -1) {
        return;
    }

    var getSoFieldValues = search.lookupFields({
        type: search.Type.SALES_ORDER,
        id: soId,
        columns: ["status", "paymentmethod"]
    });

    var pendingBilling = getSoFieldValues.status[0].text == "Pending Billing";

    if (!pendingBilling) {
        return;
    }

    var paymentMethodEmpty = getSoFieldValues.paymentmethod.length == 0;
    var creditCardPayment = false;

    if (!paymentMethodEmpty) {
        var creditCardPaymentValues = ["6", "3", "4", "5"];
        var paymentMethod = getSoFieldValues.paymentmethod[0].value;

        if (creditCardPaymentValues.indexOf(paymentMethod) > -1) {
            var creditCardAuthWithin7Days = searchPaymentAuths(soId);
            if (creditCardAuthWithin7Days) {
                creditCardPayment = true;
                log.debug("payment auth", "cc within 7 days " + itemFulRecord.getText("createdfrom"));
            } else {
                log.debug("payment auth", "cc not within 7 days " + itemFulRecord.getText("createdfrom"));
            }
        }
    }

    if (pendingBilling && paymentMethodEmpty) {
        log.debug("Sending Invoice", itemFulRecord.getText("createdfrom"));
        sendBill(soId, "invoice");
    } else if (pendingBilling && creditCardPayment) {
        log.debug("Sending Sales Receipt", itemFulRecord.getText("createdfrom"));
        sendBill(soId, "cashsale");
    } else {
        return;
    }

}

function sendBill(soId, type) {
    var recordType;

    if (type == "invoice") {
        recordType = record.Type.INVOICE;
    } else if (type == "cashsale") {
        recordType = record.Type.CASH_SALE;
    }

    var transactionRecord = record.transform({
        fromType: record.Type.SALES_ORDER,
        fromId: soId,
        toType: recordType,
        isDynamic: true
    });

    if (type == "cashsale") {
        transactionRecord.setValue({
            fieldId: "chargeit",
            value: false
        });
    }

    var billId = transactionRecord.save();

    var documentNumber = search.lookupFields({
        type: recordType,
        id: billId,
        columns: ["tranid"]
    }).tranid;

    triggerAvatax(billId, recordType);

    var emailExist = transactionRecord.getValue({
        fieldId: "email"
    });

    if (emailExist) {
        var emailAddress = emailExist.split(",");
        for (var i = 0; i < emailAddress.length; i++) {
            emailAddress[i] = emailAddress[i].trim();
        }
        sendEmail(billId, recordType, documentNumber, emailAddress);
    }

}

function searchPaymentAuths(soId) {
    var lastAuthDate = "";

    var salesorderSearchObj = search.create({
        type: "salesorder",
        filters: [
            ["type", "anyof", "SalesOrd"],
            "AND",
            ["internalidnumber", "equalto", soId],
            "AND",
            ["mainline", "is", "T"],
            "AND",
            ["paymentevent.paymenteventtype", "anyof", "AUTHORIZATION"],
            "AND",
            ["paymentevent.paymentapproved", "is", "T"]
        ],
        columns: [
            search.createColumn({
                name: "date",
                join: "paymentEvent",
                sort: search.Sort.DESC
            })
        ]
    });

    salesorderSearchObj.run().each(function (result) {
        lastAuthDate = result.getValue({
            name: "date",
            join: "paymentEvent"
        });
        return false; // one result
    });

    if (lastAuthDate) {
        var startTime = moment(lastAuthDate);
        var endTime = moment();
        var duration = moment.duration(startTime.diff(endTime));
        var differenceInHours = Math.abs(duration.asHours());

        if (differenceInHours > 168) { // more than 7 days
            lastAuthDate = false;
        } else {
            lastAuthDate = true;
        }
    }

    return lastAuthDate;
}

function triggerAvatax(id, type) {
    var environment = runtime.envType;

    if (environment == "SANDBOX") {
        cred.account += "_SB1";
    }

    var my_request = {};
    my_request.headers = {};
    my_request.headers.Authorization = "NLAuth nlauth_account=" + cred.account + ",nlauth_email=" + cred.email + ",nlauth_signature=" + cred.signature + ",nlauth_role=" + cred.role;
    my_request.headers["content-type"] = "application/json";
    my_request.url = "https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=786&deploy=1"; //Production RESTlet URL
    // my_request.url = "https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=890&deploy=1"; //Sandbox RESTlet URL
    my_request.body = JSON.stringify({
        type: type,
        id: id
    });
    var response = https.post(my_request);

    log.debug("Trigger Avatax Response", response.body);

}

function getTransactionPDF(billId) {
    var transactionId = billId;
    return render.transaction({
        entityId: transactionId,
        printMode: "PDF"
    });
}

function getRenderedEmailTemplate() {
    var EMAIL_TEMPLATE = 32;
    return render.mergeEmail({
        templateId: EMAIL_TEMPLATE,
        transactionId: record.id
    });
}

function sendEmail(billId, type, documentNumber, emailAddress) {
    var subject;
    var body;

    if (type == "invoice") {
        subject = "PDF: Invoice #" + documentNumber;
        body = "Please open the attached file to view your Invoice.";
    } else if (type == "cashsale") {
        subject = "PDF: Sales Receipt #" + documentNumber;
        body = "Please open the attached file to view your Sales Receipt";
    }


    var invoiceAttachment = getTransactionPDF(billId);
    var AR_EMPLOYEE = 943918;
    email.send({
        author: AR_EMPLOYEE,
        recipients: emailAddress,
        subject: subject,
        body: body,
        attachments: [invoiceAttachment],
        relatedRecords: {
            transactionId: billId
        }
    });
}