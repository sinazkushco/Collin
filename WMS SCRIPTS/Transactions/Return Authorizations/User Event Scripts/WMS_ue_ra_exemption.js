/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 **/

/**
 * Ticket: https://dev.azure.com/KushCo/WMS%20to%20NetSuite%20Integration/_workitems/edit/530
 * To support the WMS integration, we need to make an enhancement to the Return Authorization form.  
 * There are scenarios where we create a Return Authorization, but do not expect to receive back the physical product.  
 * This is currently handled at the Item Receipt level, but since the WMS will require us to lock down the Item Receipt, we need to add this option to the Return Authorization and build some automation.  
 * Add a new "List/Record" field called "Exempt from returning physical product?" on the RMA form.
 * Options should be No and Yes. 
 * Default will be No
 * Field will be required.
 * Orders with "No" in this field will have the "Release to Warehouse" button once they are approved, just as normal.
 * Upon receipt through the WMS, an item receipt will be created with the "Restock?" box checked for each line (default functionality)
 * Order with "Yes" in this field will not be sent to the WMS.
 * Instead, once approved, an Item Receipt should be created automatically to receive the RA in full, with the "Restock?" box not checked.
 */

define(['N/record', 'N/search', 'N/runtime'], function (record, search, runtime) {
    function beforeLoad(context) {
        var type = context.type;
        var record = context.newRecord;

        // This is used to prevent an issue where RAs that come from Invoices that are created from a IF carries the warehouse status from the original PO
        if(type === context.UserEventType.CREATE) {
            record.setValue('custbody_warehouse_status', 1)
        }
    }

    function afterSubmit(context) {
        try {
            var type = context.type,
                RETURN_AUTHORIZATION_ID = context.newRecord.id,
                isExempt = context.newRecord.getValue('custbody_exempt_return'),
                itemReceiptExists = _checkIfItemReceiptExists(RETURN_AUTHORIZATION_ID),
                orderStatus = context.newRecord.getValue('orderstatus');

            var ORDER_STATUS = {
                pendingApproval: "A",
                pendingReceipt: "B",
                canceled: "C",
                partiallyReceived: "D",
                pendingRefundPartiallyReceived: "E",
                pendingRefund: "F",
                refunded: "G",
                closed: "H"
            };
            
            log.debug('Is Exempt', JSON.stringify({
                RETURN_AUTHORIZATION_ID: context.newRecord.id,
                type: context.type,
                orderStatus: orderStatus,
                statusRef: context.newRecord.getValue('statusRef'),
                isExempt: isExempt,
                itemReceiptExists: itemReceiptExists
            }));

            if(type === context.UserEventType.DELETE) return;
            if(itemReceiptExists || !isExempt) return;

            if(orderStatus === ORDER_STATUS.pendingReceipt) {
                _createItemReceipt(RETURN_AUTHORIZATION_ID);
            }

            if (type === 'approve') {
                _createItemReceipt(RETURN_AUTHORIZATION_ID);
            }

        } catch (error) {
            log.error('An error has occured',JSON.stringify({
                error: error,
                type: context.type,
                userRole: runtime.getCurrentUser().role,
                context: context
            }));
        }
    }

    function _createItemReceipt(RETURN_AUTHORIZATION_ID) {
        var itemReceiptRecord = record.transform({
            fromType: record.Type.RETURN_AUTHORIZATION,
            fromId: RETURN_AUTHORIZATION_ID,
            toType: record.Type.ITEM_RECEIPT,
            isDynamic: true
        });

        var numberOfItems = itemReceiptRecord.getLineCount('item');
        // Fix IR form
        for (var line = 0; line < numberOfItems; line++) {
            itemReceiptRecord.selectLine({
                sublistId: 'item',
                line: line
            });

            // Set restock to false
            itemReceiptRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'restock',
                value: false
            });

            // Check the Receive box
            itemReceiptRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'itemreceive',
                value: true
            });

            // Store item's quantity
            var itemQuantity = itemReceiptRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'quantity' // quantityremaining may need to be used for standard mode as this field will not populate until itemreceive is checked.
            });

            // Inventory Details
            var hasInvetoryDetails = itemReceiptRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'inventorydetailavail'
            });

            // TODO: Remove when code is fully tested
            hasInvetoryDetails && log.debug('Has Inventory Details', hasInvetoryDetails);

            // Handle Inventory Details
            if (hasInvetoryDetails === 'T') {
                var inventoryDetailSubRecord = itemReceiptRecord.getCurrentSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'inventorydetail',
                });

                inventoryDetailSubRecord.selectLine({
                    sublistId: 'inventoryassignment',
                    line: 0
                });

                // Set item as available.
                inventoryDetailSubRecord.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'inventorystatus',
                    value: 1 // Available
                });

                // Set the item's quanitiy to the inventory details quanitiy
                inventoryDetailSubRecord.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: itemQuantity
                });

                inventoryDetailSubRecord.commitLine({
                    sublistId: 'inventoryassignment'
                });
            };

            itemReceiptRecord.commitLine({
                sublistId: 'item'
            });
        }
        itemReceiptRecord.save();
    }

    function _checkIfItemReceiptExists(RETURN_AUTHORIZATION_ID) {
        var itemreceiptSearchObj = search.create({
            type: "itemreceipt",
            filters:
                [
                    ["type", "anyof", "ItemRcpt"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["createdfrom", "anyof", RETURN_AUTHORIZATION_ID]
                ],
            columns:
                [
                    search.createColumn({ name: "entity", label: "Name" })
                ]
        });

        var searchResultCount = itemreceiptSearchObj.runPaged().count;
        // Don't run create IR if there already is an IR or if status is not pending receipt
        if (searchResultCount > 0) return true;
    };

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    }
});