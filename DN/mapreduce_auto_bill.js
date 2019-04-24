/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */
var SAVED_SEARCH_ID = "customsearch_auto_bill_script_search";
define(["N/search", "N/record", "N/log", "../Library/moment", "N/email", "N/render", "N/https", "/SuiteScripts/CW/credentials2.0.js", "N/runtime"],
    function (search, record, log, moment, email, render, https, cred, runtime) {
        function getInputData() {
            var mySearch = search.load({
                id: SAVED_SEARCH_ID
            });
            return mySearch;
        }

        function map(context) {
            var searchResult = JSON.parse(context.value);
            // delivery_confirmation_log_id = searchResult.id;
            try {
                // var dlcf_json = JSON.parse(searchResult.values.custrecord_dclf_json);
                var soResults = searchResult.values;
                log.debug("soResults", soResults);
                initAutoBillCheck(soResults);
            } catch (e) {
                // email.send({
                //     author: 172124, //id of sender
                //     recipients: [172124], //array of ids, can be numbers or strings
                //     subject: "Auto Bill Error - SO ID" + searchResult.id,
                //     body: e
                // });
            }
        }

        function initAutoBillCheck(soResultsObj) {
            var dateInfo, trandate, postingperiod;
            var soId = soResultsObj.internalid.value;
            var creditCardPayment = false;
            var paymentMethod = soResultsObj.paymentmethod;
            var tax = parseFloat(soResultsObj.formulanumeric) > 0;

            if (paymentMethod) {
                var creditCardPaymentValues = ["6", "3", "4", "5"];
                var creditCardPaymentMethod = soResultsObj.paymentmethod.value;

                if (creditCardPaymentValues.indexOf(creditCardPaymentMethod) > -1) {
                    var creditCardAuthWithin7Days = searchPaymentAuths(soId);
                    if (creditCardAuthWithin7Days) {
                        creditCardPayment = true;
                        log.debug("payment auth", "cc within 7 days, so id" + soId);
                    } else {
                        log.debug("payment auth", "cc not within 7 days " + soId);
                    }
                }
            }

            if (!paymentMethod) { //payment method empty
                dateInfo = obtainFulDate(soId);
                trandate = dateInfo.trandate;
                postingperiod = dateInfo.postingperiod;
               
                log.debug("Sending Invoice - so id", soId);
                sendBill(soId, tax, trandate, postingperiod, "invoice");
            } else if (creditCardPayment) {
                dateInfo = obtainFulDate(soId);
                trandate = dateInfo.trandate;
                postingperiod = dateInfo.postingperiod;
               
                log.debug("Sending Sales Receipt so id", soId);
                sendBill(soId, tax, trandate, postingperiod, "cashsale");
            } else {
                return;
            }

        }

        function sendBill(soId, tax, trandate, postingperiod, type) {
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

            transactionRecord.setValue({
                fieldId: "trandate",
                value: new Date(trandate)
            });

            transactionRecord.setValue({
                fieldId: "postingperiod",
                value: postingperiod
            });

            if (type == "cashsale" && tax) {
                transactionRecord.setValue({
                    fieldId: "chargeit",
                    value: true
                });
            }

            // God and I knew why this was here when this was created, but only god knows now.
            // if (tax){
            //     transactionRecord.setValue({
            //         fieldId: "chargeit",
            //         value: true
            //     });
            // }

            var billId = transactionRecord.save();

            // log.debug("tax", tax);
            // if (tax) {
            //     triggerAvatax(billId, recordType);
            // }

            var emailExist = transactionRecord.getValue({
                fieldId: "email"
            });

            if (emailExist) {
                var emailAddress = emailExist.split(",");
                for (var i = 0; i < emailAddress.length; i++) {
                    emailAddress[i] = emailAddress[i].trim();
                }
                sendEmail(billId, recordType, emailAddress);
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

        // function triggerAvatax(id, type) {
        //     var environment = runtime.envType;
        //     var my_request = {};

        //     if (environment == "SANDBOX") {
        //         cred.account += "_SB1";
        //         my_request.url = "https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=890&deploy=1"; //Sandbox RESTlet URL
        //     } else {
        //         my_request.url = "https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=786&deploy=1"; //Production RESTlet URL
        //     }

        //     my_request.headers = {};
        //     my_request.headers.Authorization = "NLAuth nlauth_account=" + cred.account + ",nlauth_email=" + cred.email + ",nlauth_signature=" + cred.signature + ",nlauth_role=" + cred.role;
        //     my_request.headers["content-type"] = "application/json";
        //     my_request.body = JSON.stringify({
        //         type: type,
        //         id: id
        //     });

        //     var response = https.post(my_request);
        //     log.debug("Trigger Avatax Response", response.body);
        // }

        function triggerAvatax(id, type){
            var loadToApplyTax = record.load({
                type: type,
                id: id
            });
    
            //charges credit card
            if (type == "cashsale") {
                loadToApplyTax.setValue({
                    fieldId: "chargeit",
                    value: true
                });
            }
    
            loadToApplyTax.save();
            log.debug("Trigger Avatax Response", "Record Reloaded");
        }

        function obtainFulDate(soId) {
            var dateInfo = {};
            var itemfulfillmentSearchObj = search.create({
                type: "itemfulfillment",
                filters: [
                    ["type", "anyof", "ItemShip"],
                    "AND",
                    ["createdfrom", "anyof", soId],
                    "AND",
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({
                        name: "trandate",
                        sort: search.Sort.DESC
                    }),
                    "postingperiod",
                    "type",
                    "tranid",
                    "entity"
                ]
            });

            itemfulfillmentSearchObj.run().each(function (result) {
                dateInfo["trandate"] = result.getValue("trandate");
                dateInfo["postingperiod"] = result.getValue("postingperiod");
                return false;
            });

            return dateInfo;
        }

        function getTransactionPDF(billId) {
            var transactionId = billId;
            return render.transaction({
                entityId: transactionId,
                printMode: "PDF"
            });
        }

        // function getRenderedEmailTemplate() {
        //     var EMAIL_TEMPLATE = 32;
        //     return render.mergeEmail({
        //         templateId: EMAIL_TEMPLATE,
        //         transactionId: record.id
        //     });
        // }

        function sendEmail(billId, recordType, emailAddress) {
            var subject;
            var body;

            var documentNumber = search.lookupFields({
                type: recordType,
                id: billId,
                columns: ["tranid"]
            }).tranid;

            if (recordType == "invoice") {
                subject = "PDF: Invoice #" + documentNumber;
                body = "Please open the attached file to view your Invoice.";
            } else if (recordType == "cashsale") {
                subject = "PDF: Sales Receipt #" + documentNumber;
                body = "Please open the attached file to view your Sales Receipt";
            }

            var transactionPDF = getTransactionPDF(billId);
            var employeeId = 943918; // No Reply @ KB
            email.send({
                author: employeeId,
                recipients: emailAddress,
                subject: subject,
                body: body,
                attachments: [transactionPDF],
                relatedRecords: {
                    transactionId: billId
                }
            });
        }
        return {
            getInputData: getInputData,
            map: map
        };
    });