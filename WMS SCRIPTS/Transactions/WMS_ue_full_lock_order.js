/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define(["N/error", "N/runtime", "N/record", "N/search", "N/ui/serverWidget", "../../Configs/po_item_sublist_fields.js", "../../Configs/po_roles_whitelist.js"], function (error, runtime, record, search, serverWidget, PO_FIELDS, PO_ROLES_WHITELIST) {
    var userRole = Number(runtime.getCurrentUser().role);
    var WAREHOUSE_STATUS = {
        notReleased: 1, // Not Locked
        pendingRelease: 2, // Full Lock
        partiallyReleased: 3,
        released: 4, // Not Locked
        completed: 5
    };

    function beforeSubmit(context) {
        if (context.type == context.UserEventType.DELETE) return;
        if (userRole === 3 || userRole === 1114) return;

        var KCH_WHITELIST = _getWhiteListMap(); // Edit this function to add a KCH record to allow roles to bypass full lock
        var transactionType = context.newRecord.type;
        var lineLevelTransactions = _getLineLevelTransactions(); // Transactions that require locking based on line level fields
        var headerLevelTransactions = _getHeaderLevelTransactions(); // Transactions that require locking based on header level fields

        // Handle Header Level Transactions
        if (headerLevelTransactions[transactionType] && (runtime.executionContext === runtime.ContextType.USER_INTERFACE)) {
            // Special case for inventory transfer where we need to check for an to/from field
            if (transactionType.INVENTORY_TRANSFER) {
                blockHeaderTransfer(context, {
                    additionalLocationField: "transferlocation"
                });
            }

            blockHeaderTransfer(context);
        }

        // Handle Line Level Transactions
        if (lineLevelTransactions[transactionType]) {
            log.debug('Line Level Transaction', JSON.stringify({
                transactionType: transactionType,
                executionContext: runtime.executionContext,
                script: runtime.getCurrentScript(),
                currentSession: runtime.getCurrentSession(),
                user: runtime.getCurrentUser()
            }))
        }

        if (lineLevelTransactions[transactionType] && runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
            var recordType = context.newRecord.type;
            log.debug("Blocking Edit by Line", recordType);

            if (_shouldAllowUserToByPass(recordType)) return;

            if (_checkIfScaleEnabled(context)) {

                if (recordType == record.Type.ITEM_RECEIPT) {
                    if (onlyReceivingNonPhysical(context)) {
                        return;
                    }
                }

                _throwPermissionError("scaleEnabled");
            }

            return;
        }

        // Has to be below header/line level transactions
        if (context.type !== context.UserEventType.XEDIT) {
            return;
        }

        var warehouseStatus = context.oldRecord.getValue("custbody_warehouse_status");
        var oldHasReceiptInWms = context.oldRecord.getValue("custbody_receipt_in_wms");
        var newHasReceiptInWms = context.newRecord.getValue("custbody_receipt_in_wms");

        // Lock if Receipt in WMS is true, regardless of status
        if (oldHasReceiptInWms && newHasReceiptInWms) {
            _throwPermissionError();
        }

        // Keeping this section out of the handle header level transactions section above as it is easier to maintain and requires us to block xedit.
        if (transactionType === record.Type.SALES_ORDER) {
            if (
                warehouseStatus === WAREHOUSE_STATUS.pendingRelease ||
                warehouseStatus === WAREHOUSE_STATUS.partiallyReleased ||
                warehouseStatus === WAREHOUSE_STATUS.released
            ) {
                if (userRole === 1048) return; // Allow Senior accountants through
                _throwPermissionError();
            }
        }

        if (transactionType === record.Type.TRANSFER_ORDER) {
            if (warehouseStatus === WAREHOUSE_STATUS.pendingRelease) {
                _throwPermissionError();
            }
        }

        if (transactionType === record.Type.PURCHASE_ORDER) {
            if (
                warehouseStatus === WAREHOUSE_STATUS.pendingRelease ||
                warehouseStatus === WAREHOUSE_STATUS.released
            ) {
                var WHITELISTEDROLES_PO = PO_ROLES_WHITELIST.PARTIAL_LOCK;
                if (WHITELISTEDROLES_PO[userRole]) return;
                _throwPermissionError();
            }
        }

        if (transactionType === record.Type.WORK_ORDER) {
            if (warehouseStatus === WAREHOUSE_STATUS.released) {
                _throwPermissionError();
            }
        }

        if (transactionType === record.Type.RETURN_AUTHORIZATION) {
            if (warehouseStatus === WAREHOUSE_STATUS.pendingRelease) {
                _throwPermissionError();
            }
        }

        // Helper functions that must be in this scope
        function _getWhiteListMap() {
            var KCH_WHITELIST = {};
            KCH_WHITELIST[record.Type.INVENTORY_ADJUSTMENT] = {
                id: 4,
                column: "custrecord_ia_allowed_roles"
            };
            return KCH_WHITELIST;
        }

        function _shouldAllowUserToByPass(recordType) {
            if (KCH_WHITELIST[recordType]) {
                var whiteListMap = KCH_WHITELIST[recordType],
                    id = whiteListMap.id,
                    column = whiteListMap.column;

                var allowedRoles = search.lookupFields({
                    type: "customrecord_kch_field_controller",
                    id: id,
                    columns: [column]
                })[column].map(function (role) {
                    return Number(role.value);
                });

                log.debug("Allowed Roles", JSON.stringify({
                    allowedRoles: allowedRoles,
                    userRole: userRole
                }));

                if (allowedRoles.indexOf(userRole) > -1) {
                    log.debug("Allowing Role through", JSON.stringify({
                        userRole: userRole,
                        allowedRoles: allowedRoles
                    }));
                    return true;
                }
            }
            return false;
        }

        function blockHeaderTransfer(context, options) {
            // Exceptions - Will not block header transfer
            var recordType = context.newRecord.type;
            log.debug("Blocking Edit by Header", recordType);
            if (_shouldAllowUserToByPass(recordType)) return;

            var itemLocationId = context.newRecord.getValue("location");
            var isScaleEnabled = Boolean(search.lookupFields({
                type: "location",
                id: itemLocationId,
                columns: ["custrecord_scale_enabled"]
            }).custrecord_scale_enabled);

            if ((options !== undefined) && options.additionalLocationField && !isScaleEnabled) {
                isScaleEnabled = isScaleEnabled || Boolean(search.lookupFields({
                    type: "location",
                    id: context.newRecord.getValue(options.additionalLocationField),
                    columns: ["custrecord_scale_enabled"]
                }).custrecord_scale_enabled);
            }

            if (isScaleEnabled) {
                _throwPermissionError("scaleEnabled");
            }
        }
    }

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
            // Exception for admins
            if (userRole === 3 || userRole === 1114) return;

            var warehouseStatus = Number(context.newRecord.getValue("custbody_warehouse_status"));
            var transactionType = context.newRecord.type;
            var hasReceiptInWms = context.newRecord.getValue("custbody_receipt_in_wms");

            switch (transactionType) {
                case record.Type.WORK_ORDER:
                    if (warehouseStatus === WAREHOUSE_STATUS.released) {
                        context.form.removeButton({
                            id: "edit"
                        });
                    }
                    break;
                case record.Type.PURCHASE_ORDER:
                    var orderContainNonPhysicalItems = doesOrderContainsNonInvt(context); //TRUE
                    if (
                        warehouseStatus == WAREHOUSE_STATUS.pendingRelease ||
                        warehouseStatus == WAREHOUSE_STATUS.released
                    ) {
                        var WHITELISTEDROLES_PO = PO_ROLES_WHITELIST.PARTIAL_LOCK;

                        if (WHITELISTEDROLES_PO[userRole]) {
                            var bodyfields = PO_FIELDS.body;

                            bodyfields.forEach(function (field) {
                                var bodyField = context.form.getField(field);
                                if (bodyField) { // Some body fields may not exist for, and it will return null.
                                    bodyField.updateDisplayType({
                                        displayType: serverWidget.FieldDisplayType.INLINE
                                    });
                                }

                            });
                        } else {
                            context.form.removeButton({
                                id: "edit"
                            });
                        }
                        if (!orderContainNonPhysicalItems) {
                            context.form.removeButton({
                                id: "receive"
                            });
                        }
                    }
                    break;

                case record.Type.TRANSFER_ORDER:
                    if (context.newRecord) {
                        var isScaleEnabled = search.lookupFields({
                            type: "location",
                            id: context.newRecord.getValue('location'),
                            columns: ["custrecord_scale_enabled"]
                        }).custrecord_scale_enabled;

                        // Remove Fulfill button if is scale enabled.
                        if (isScaleEnabled) {
                            context.form.removeButton({
                                id: "process"
                            });
                        }
                    }

                    if (hasReceiptInWms || (warehouseStatus == WAREHOUSE_STATUS.pendingRelease)) {
                        context.form.removeButton({
                            id: "edit"
                        });
                    }
                    break;

                case record.Type.RETURN_AUTHORIZATION:
                    if (warehouseStatus === WAREHOUSE_STATUS.pendingRelease || warehouseStatus === WAREHOUSE_STATUS.released) {
                        context.form.removeButton({
                            id: "edit"
                        });
                        context.form.removeButton({
                            id: "closeremaining" // or possibly close
                        });
                    }
                    break;

                case record.Type.ITEM_FULFILLMENT:
                    if (_checkIfScaleEnabled(context)) {
                        context.form.removeButton({
                            id: "delete"
                        });
                        if (context.newRecord.getValue("statusRef") === "shipped") {
                            if (_checkIfScaleEnabled(context)) {
                                context.form.removeButton({
                                    id: "edit"
                                });
                            }
                            return;
                        }
                        return;
                    }
                    break;

                case record.Type.SALES_ORDER:
                    var transactionId = context.newRecord.id;
                    
                    if (userRole === 1048) return; // Allow Senior accountants through
                    // Remove Edit Button
                    if (
                        warehouseStatus === WAREHOUSE_STATUS.pendingRelease ||
                        warehouseStatus === WAREHOUSE_STATUS.partiallyReleased ||
                        warehouseStatus === WAREHOUSE_STATUS.released ||
                        warehouseStatus === WAREHOUSE_STATUS.completed
                    ) {
                        context.form.removeButton({
                            id: "edit"
                        });
                    }
                    // Remove Fulfill button
                    var isShipComplete = context.newRecord.getValue('custbody_ship_complete');
                    if(isShipComplete && _checkIfAllItemsAreAvailable(transactionId)) {
                        context.form.removeButton({
                            id: "process"
                        });
                    }

                    if (warehouseStatus === WAREHOUSE_STATUS.notReleased) {
                        context.form.removeButton({
                            id: "process"
                        });
                    }
                    break;

                default:
                    // Full Lock
                    if (warehouseStatus == WAREHOUSE_STATUS.pendingRelease) {
                        context.form.removeButton({
                            id: "edit"
                        });
                    }
            }
        }
    }

    function _checkIfScaleEnabled(context) {
        var itemFul = context.newRecord;
        var sublist = "item";
        if (context.newRecord.type == record.Type.INVENTORY_ADJUSTMENT) {
            sublist = "inventory";
        }

        var itemCount = itemFul.getLineCount(sublist);


        for (var i = 0; i < itemCount; i++) {
            var itemReceive = itemFul.getSublistValue({
                sublistId: sublist,
                fieldId: "itemreceive",
                line: i
            });

            if (context.newRecord.type == record.Type.INVENTORY_ADJUSTMENT) {
                itemReceive = true;
            }

            if (itemReceive) {
                var itemLocationId = itemFul.getSublistValue({
                    sublistId: sublist,
                    fieldId: "location",
                    line: i
                });

                var isScaleEnabled = search.lookupFields({
                    type: "location",
                    id: itemLocationId,
                    columns: ["custrecord_scale_enabled"]
                }).custrecord_scale_enabled;

                if (isScaleEnabled) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    function _throwPermissionError(name) {
        var errorObject;

        switch (name) {
            case "scaleEnabled":
                errorObject = {
                    "name": "KB_INVALID_LOCATION",
                    "message": "You are unable to ship to or receive from a SCALE enabled warehouse",
                    "notifyOff": true
                };
                break;
            default:
                errorObject = {
                    "name": "KB_INVALID_PERMISSION",
                    "message": "Unable to edit this record at this time",
                    "notifyOff": true
                };

        }

        var editError = error.create(errorObject);

        throw editError.message;
    }

    function _getHeaderLevelTransactions() {
        var headerLevelTransactions = {};
        headerLevelTransactions[record.Type.ASSEMBLY_BUILD] = true;
        headerLevelTransactions[record.Type.INVENTORY_TRANSFER] = true;
        headerLevelTransactions[record.Type.INVENTORY_STATUS_CHANGE] = true;

        return headerLevelTransactions;
    }

    function _getLineLevelTransactions() {
        var lineLevelTransactions = {};
        lineLevelTransactions[record.Type.ITEM_FULFILLMENT] = true;
        lineLevelTransactions[record.Type.ITEM_RECEIPT] = true;
        lineLevelTransactions[record.Type.INVENTORY_ADJUSTMENT] = true;

        return lineLevelTransactions;
    }

    function doesOrderContainsNonInvt(context) {
        var purchaseOrder = context.newRecord;
        var sublist = "item";
        var nonInvtItemFound = false;

        var itemCount = purchaseOrder.getLineCount(sublist);

        for (var i = 0; i < itemCount; i++) {
            var itemType = purchaseOrder.getSublistValue({
                sublistId: sublist,
                fieldId: "itemtype",
                line: i
            });

            if (itemType !== "InvtPart" && itemType !== "Assembly") {
                nonInvtItemFound = true;
                break;
            }
        }

        return nonInvtItemFound;
    }

    function onlyReceivingNonPhysical(context) {
        var itemReceipt = context.newRecord;
        var sublist = "item";
        var onlyNonPhysicalItems = true;

        var itemCount = itemReceipt.getLineCount(sublist);

        for (var i = 0; i < itemCount; i++) {
            var itemReceive = itemReceipt.getSublistValue({
                sublistId: sublist,
                fieldId: "itemreceive",
                line: i
            });

            if (itemReceive) {
                var itemType = itemReceipt.getSublistValue({
                    sublistId: sublist,
                    fieldId: "itemtype",
                    line: i
                });

                if (itemType == "InvtPart" || itemType == "Assembly") {
                    onlyNonPhysicalItems = false;
                    break;
                }
            }

        }
        return onlyNonPhysicalItems;
    }

    function _checkIfAllItemsAreAvailable(soId) {
        if(!soId) return false;

        var areAllItemsAvailable = search.create({
            type: "salesorder",
            filters:
                [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["custbody_ship_complete", "is", "T"],
                    "AND",
                    ["item.type", "anyof", "Assembly", "InvtPart"],
                    "AND",
                    ["internalidnumber", "equalto", soId],
                    "AND",
                    ["sum(formulanumeric: ABS({quantity}) - {quantitycommitted})", "equalto", "0"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "tranid",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "quantitycommitted",
                        summary: "SUM"
                    }),
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "SUM",
                        formula: "ABS({quantity})"
                    })
                ]
        }).runPaged().count ? true : false;
        
        return areAllItemsAvailable;
    }

    return {
        beforeSubmit: beforeSubmit,
        beforeLoad: beforeLoad
    };
});