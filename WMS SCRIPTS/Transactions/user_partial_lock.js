/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/log", "N/record", "N/search", "N/runtime", "N/ui/serverWidget", "../../Configs/so_item_sublist_fields.js"],

    function (log, record, search, runtime, serverWidget, soFields) {
        //hard code the roles that will not get locked down
        var ADMIN_ROLES = []; //3 is admin
        var FINANCE_ROLES = [1048];

        function beforeLoad(context) {
            var recStatus = context.newRecord.getValue("orderstatus");
            var whStatus = context.newRecord.getValue("custbody_warehouse_status");
            var orderUnlocked = whStatus == "1" || whStatus == "" ? true : false;
            var userRole = Number(runtime.getCurrentUser().role);
            var form = context.form;

            if ((runtime.executionContext == runtime.ContextType.USER_INTERFACE) && (context.type == context.UserEventType.EDIT) && recStatus != "A" && orderUnlocked) { //context.newRecord.getValue("orderstatus") != "B"

                if (ADMIN_ROLES.indexOf(runtime.getCurrentUser().role) > -1) {
                    return; //exit the admin roles as specificed above
                }

                // Special case for finance team that white lists only payment fields.
                if (FINANCE_ROLES.indexOf(userRole) > -1) {
    
                    var whiteListedSoBodyFields = ["paymentmethod", "custbody_payment_on_delivery", "paymentsessionamount", "creditcard", "ccnumber", "ccsecuritycode", "ccexpiredate", "custbody_deposit_amount", "ccname", "ccstreet", "cczipcode", "creditcardprocessor", "getauth", "ccapproved", "pnrefnum", "authcode", "ccavsstreetmatch", "ccavszipmatch", "ccsecuritycodematch", "isrecurringpayment", "ccprocessaspurchasecard"];
                    var transactionBodyFields = [];
                    
                    if(context.newRecord.type === record.Type.SALES_ORDER){
                        transactionBodyFields = soFields.body; // Array of transaction body field ids (String)
                    }

                    transactionBodyFields.forEach(function(field) {
                        if(whiteListedSoBodyFields.indexOf(field) > -1) {
                            return
                        } else {
                            var bodyField = form.getField(field);
                            if(bodyField) { // Some body fields may not exist for, and it will return null.
                                bodyField.updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.INLINE
                                });
                            }
                        }
                    });

                    return;
                }

                var blackList = [];
                var blackListedBodyFields = ["entity", "trandate", "shipdate"];
                
                var fulfillmentsFound = findExistingFulfillments(context.newRecord.id);
                if (fulfillmentsFound) {
                    blackList.push("shipaddress", "shipaddresslist");
                }

                blackList = blackList.concat(blackListedBodyFields)

                //spin through the lists and disable
                for (var i = 0; i < blackList.length; i++) {
                    disableField(context, blackList[i]);
                }
            }
        }

        function disableField(context, fieldName) {
            // var funcName = scriptName + "disableField " + fieldName; //create an exception list of fields that we do NOT want disabled var FIELDS_TO_EXCLUDE = ["custbody_v_order_notes"]; if (FIELDS_TO_EXCLUDE.indexOf(fieldName) >= 0){
            //get reference to the form field to disable it.
            var fld = context.form.getField(fieldName);
            if (fld) {
                fld.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });
            } 
            return;
        }

        function findExistingFulfillments(internalid) {
            var fulfillmentsFound = false;

            var itemfulfillmentSearchObj = search.create({
                type: "itemfulfillment",
                filters: [
                    ["type", "anyof", "ItemShip"],
                    "AND",
                    ["createdfrom", "anyof", internalid]
                ],
                columns: [
                    "internalid"
                ]
            });
            var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
            log.debug("searchResultCount", searchResultCount);
            if (searchResultCount > 0) {
                fulfillmentsFound = true;
            }
            return fulfillmentsFound;
        }

        return {
            beforeLoad: beforeLoad
        };
    }
);