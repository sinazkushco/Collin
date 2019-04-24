/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
    "N/runtime",
    "../../../../Configs/so_item_sublist_fields.js",
    "../../../../Configs/sample_order_item_sublist_fields.js"
],
    function (
        runtime,
        sublistFields,
        sampleOrderSublistFields
    ) {
        // hard code the roles that will not get locked down
        var ADMIN_ROLES = [3]; // 3 is admin
        var FINANCE_ROLES = [1048];
        var userRole = Number(runtime.getCurrentUser().role);


        function pageInit(context) {
            var recStatus = context.currentRecord.getValue("orderstatus");
            var whStatus = context.currentRecord.getValue("custbody_warehouse_status");
            var orderUnlocked = whStatus == "1" || whStatus == "" ? true : false;

            var alwaysLock = [
                //always disable
                "a[id^=entity]", //all Customer helper buttons
                "a.i_calendar:not(:not([id^=trandate],[id^=shipdate]))", // Date picker for trandate and shipdate
                "a[id^=shipaddresslist]", //all Shipping Address helper buttons
                "a[id^=billaddresslist_popup_link]", //Billing Address Edit button (dont need to disable create, in case salesrep wants to add a billaddress)
            ]

            if ((runtime.executionContext == runtime.ContextType.USER_INTERFACE) && recStatus != "A" && orderUnlocked) { //context.newRecord.getValue("orderstatus") != "B"

                if (ADMIN_ROLES.indexOf(userRole) > -1) {
                    return true; //exit the admin roles as specificed above
                }

                if(FINANCE_ROLES.indexOf(userRole) > -1) {
                    var financeLock = [
                        //partial lock - disable all buttons not relating to billing
                        "a[data-helperbuttontype=open]:not([id^='custbody_creditmemo_to_apply'],[id^='creditcard'])", //Edit button to edit a current dropdowns values, except for creditcard and creditmemo application
                        "a[data-helperbuttontype=new]:not([id^='creditcard'])", //New + button to create a new dropdown, except for creditcard
                    ]

                    financeLock.forEach(function(element) {
                        jQuery(element).remove();
                    });
                    return;
                }

                alwaysLock.forEach(function(element){
                    jQuery(element).remove();
                });
            }
        }

        function validateLine(context) {
            var recStatus = context.currentRecord.getValue("orderstatus");
            var whStatus = context.currentRecord.getValue("custbody_warehouse_status");
            var orderUnlocked = whStatus == "1" || whStatus == "" ? true : false;
            var sublistId = context.sublistId;

            if ((runtime.executionContext == runtime.ContextType.USER_INTERFACE) && recStatus != "A" && orderUnlocked) { //context.newRecord.getValue("orderstatus") != "B"
                if (ADMIN_ROLES.indexOf(userRole) > -1) return true; //exit the admin roles as specificed above

                if (sublistId == "item") {
                    alert("Unapprove this order to enable editing");
                    return false;
                }
            }
            return true;
        }

        function lineInit(context) {
            var recStatus = context.currentRecord.getValue("orderstatus");
            var whStatus = context.currentRecord.getValue("custbody_warehouse_status");
            var orderUnlocked = whStatus == "1" || whStatus == "" ? true : false;
            var userRole = Number(runtime.getCurrentUser().role);
            var sublistId = context.sublistId;

            if ((runtime.executionContext == runtime.ContextType.USER_INTERFACE) && recStatus != "A" && orderUnlocked) { //context.newRecord.getValue("orderstatus") != "B"
                if (ADMIN_ROLES.indexOf(userRole) > -1) return true; //exit the admin roles as specificed above

                if (sublistId == "item") {
                    disableItemLines(context);
                }
            }
            return true;
        }

        function disableItemLines(context) {
            var currentRecord = context.currentRecord;
            var sublistId = context.sublistId;
            var formType = Number(currentRecord.getValue('customform'));
            var currentIndex = currentRecord.getCurrentSublistIndex({
                sublistId: sublistId
            });


            if (formType === 169) {
                sampleOrderSublistFields.item.forEach(function (fieldId) {
                    try {
                        currentRecord.getSublistField({
                            sublistId: sublistId,
                            fieldId: fieldId,
                            line: currentIndex
                        }).isDisabled = true;
                    } catch (e) {
                        // Try Catch needs to be here because it WILL throw on fields are not shown.
                    }
                });
            } else {
                for (var i = 0; i < sublistFields.item.length; i++) {
                    try {
                        var lineField = currentRecord.getSublistField({
                            sublistId: sublistId,
                            fieldId: sublistFields.item[i],
                            line: currentIndex
                        });

                        lineField.isDisabled = true;
                    } catch (e) {
                        // Try Catch needs to be here because it WILL throw on fields are not shown.
                    }
                }

            }
        }

        return {
            pageInit: pageInit,
            lineInit: lineInit,
            validateLine: validateLine
        };
    }
);