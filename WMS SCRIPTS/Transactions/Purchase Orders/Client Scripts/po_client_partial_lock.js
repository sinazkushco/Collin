/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
        "N/runtime",
        "../../../../Configs/po_item_sublist_fields.js",
        "../../../../Configs/po_roles_whitelist.js"
    ],
    function (
        runtime,
        PO_SUBLIST_FIELDS,
        PO_ROLES_WHITELIST
    ) {
        // hard code the roles that will not get locked down
        var ADMIN_ROLES = [3, 1114]; // 3 is admin
        var WHITELISTEDROLES_PO = PO_ROLES_WHITELIST.PARTIAL_LOCK;
        var userRole = Number(runtime.getCurrentUser().role);

        function pageInit(context) {
            var orderstatus = context.currentRecord.getValue("orderstatus");

            var alwaysLock = [
                //always disable
                "a[id^=entity]", //all Customer helper buttons
                "a.i_calendar:not([id^=trandate])", // Date picker for trandate
                "a[id^=shipaddresslist]", //all Shipping Address helper buttons
                "a[id^=billaddresslist_popup_link]" //Billing Address Edit button (dont need to disable create, in case salesrep wants to add a billaddress)
            ];
            var partialLock = [
                //partial lock - disable all buttons not relating to billing
                "a[data-helperbuttontype=open]", //Edit button to edit a current dropdowns values
                "a[data-helperbuttontype=new]" //New + button to create a new dropdown
            ];

            if ((runtime.executionContext === runtime.ContextType.USER_INTERFACE) && is_PO_approved(orderstatus)) {

                if (ADMIN_ROLES.indexOf(userRole) > -1) {
                    return true; //exit the admin roles as specificed above
                }

                if(WHITELISTEDROLES_PO[userRole]) {
                    partialLock.forEach(function(element) {
                        if (element) {
                            jQuery(element).remove();
                        }
                    });
                    return;
                }

                alwaysLock.forEach(function(element){
                    if (element) {
                        jQuery(element).remove();
                    }
                });
            }
        }



        function lineInit(context) {
            var currentRecord = context.currentRecord;
            var warehouse_status = currentRecord.getValue("custbody_warehouse_status");

            if ((runtime.executionContext === runtime.ContextType.USER_INTERFACE) && is_PO_in_scale_and_locked_by_client_full_lock_order_script(warehouse_status)) {
                if (ADMIN_ROLES.indexOf(userRole) > -1) return true; //exit the admin roles as specified above

                //currently, only procurement and senior accountant actually reaches in here, as dictated by the full lock script
                var sublistId = context.sublistId;
                if (sublistId === "item") {

                    if (isItemVendorPrepay(currentRecord)){
                        console.log('is vendor prepay');
                    } else {
                        console.log('NOT prepay');
                        disableSublistColumns(context, PO_SUBLIST_FIELDS);
                    }
                }
            }

            return true;
        }

        function validateInsert_and_validateLine_and_validateDelete(context) {
            var currentRecord = context.currentRecord;
            var warehouse_status = currentRecord.getValue("custbody_warehouse_status");

            if ((runtime.executionContext === runtime.ContextType.USER_INTERFACE) && is_PO_in_scale_and_locked_by_client_full_lock_order_script(warehouse_status)) {
                if (ADMIN_ROLES.indexOf(userRole) > -1) return true; //exit the admin roles as specified above

                //currently, only procurement and senior accountant actually reaches in here, as dictated by the full lock script
                var sublistId = context.sublistId;
                if (sublistId === "item") {

                    if (!isItemVendorPrepay(currentRecord)){
                        alert('The PO has been released to SCALE and the lines can not be modified.  Receive or Close the PO in SCALE to unlock this PO in NetSuite.');
                        return false;
                    }
                }
            }

            return true;
        }

        function isItemVendorPrepay(currentRecord){
            var VENDOR_PREPAYMENT_ITEM = {
                9560: "Positive",
                9660: "Negative",
                9661: "Group"
            };
            var currentItemID = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item'
            });
            console.log({currentItemID: currentItemID, returns: VENDOR_PREPAYMENT_ITEM[currentItemID]})
            return VENDOR_PREPAYMENT_ITEM[currentItemID]
        }

        function disableSublistColumns(context, PO_SUBLIST_FIELDS) {
            var ALL_PO_ITEM_FIELDS_TO_DISABLE = PO_SUBLIST_FIELDS.item;
            console.log(ALL_PO_ITEM_FIELDS_TO_DISABLE.length);
            var PO_ITEM_FIELDS_BEING_DISABLED = ALL_PO_ITEM_FIELDS_TO_DISABLE.filter(itemFieldsToNotDisableOnPOs);
            console.log(PO_ITEM_FIELDS_BEING_DISABLED.length);

            var currentRecord = context.currentRecord;
            var sublistId = context.sublistId;
            var currentIndex = currentRecord.getCurrentSublistIndex({
                sublistId: sublistId
            });

            for (var i = 0; i < PO_ITEM_FIELDS_BEING_DISABLED.length; i++) {
                try {
                    var fieldId = PO_ITEM_FIELDS_BEING_DISABLED[i];
                    console.log(fieldId);

                    var lineField = currentRecord.getSublistField({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        line: currentIndex
                    });

                    lineField.isDisabled = true;
                } catch (e) {
                    // Try Catch needs to be here because it WILL throw on fields are not shown.
                }
            }

            function itemFieldsToNotDisableOnPOs(field){
                var PO_SUBLIST_ITEM__FieldsToNotDisable = [
                    'custcol_exit_date_line'
                ];

                return PO_SUBLIST_ITEM__FieldsToNotDisable.indexOf(field) === -1;
            }
        }

        function is_PO_approved(orderstatus){
            var PO_STATUS = {
                PendingSupervisorApproval: "A",
                PendingReceipt: "B",
                RejectedBySupervisor: "C",
                PartiallyReceived: "D",
                PendingBilling_PartiallyReceived: "E",
                PendingBill: "F",
                FullyBilled: "G",
                Closed: "H"
            };

            return orderstatus === PO_STATUS.PendingReceipt ||
                orderstatus === PO_STATUS.PartiallyReceived ||
                orderstatus === PO_STATUS.PendingBilling_PartiallyReceived ||
                orderstatus === PO_STATUS.PendingBill ||
                orderstatus === PO_STATUS.FullyBilled

                || orderstatus === PO_STATUS.RejectedBySupervisor
                || orderstatus === PO_STATUS.Closed
            //the reason I'm not doing {orderstatus !== PendingSupervisorApproval} is because I dont want undefined to cause a return of true
        }

        function is_PO_in_scale_and_locked_by_client_full_lock_order_script(warehouse_status) {
            warehouse_status = Number(warehouse_status);
            var WAREHOUSE_STATUSES = {
                NotReleased: 1,
                PendingRelease: 2,
                PartiallyReleased: 3,
                Released: 4,
                Completed: 5
            };

            return warehouse_status === WAREHOUSE_STATUSES.PendingRelease ||
                warehouse_status === WAREHOUSE_STATUSES.Released;
        }

        return {
            pageInit: pageInit,
            lineInit: lineInit,
            validateInsert_and_validateLine_and_validateDelete: validateInsert_and_validateLine_and_validateDelete
        };
    }
);