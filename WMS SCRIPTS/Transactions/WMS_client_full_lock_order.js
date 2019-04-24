/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 */


/**
 * Full Lock is defined as preventing the user from editing the record
 * This file is shared across multiple transaction records
**/

define(['N/runtime', 'N/record', "../../Configs/po_roles_whitelist.js"], function (runtime, record, PO_ROLES_WHITELIST) {

    function _preventEditMode(){
        alert('You cannot edit this order at this time');
        window.location.href = window.location.href.replace(/&e=T/, '');
    }

    function preventEditMode(context) {
        // Admin exception
        var userRole = Number(runtime.getCurrentUser().role);
        if (userRole === 3) { // Allow Admins to go through
            return true
        }
        
        var WAREHOUSE_STATUS = {
            notReleased: 1, 
            pendingRelease: 2,
            partiallyReleased: 3,
            released: 4, 
            completed: 5,
        };
        var warehouseStatus = parseInt(context.currentRecord.getValue('custbody_warehouse_status'));
        var transactionType = context.currentRecord.type;
        var hasReceiptInWms = context.currentRecord.getValue('custbody_receipt_in_wms');

        if(transactionType === record.Type.SALES_ORDER) {
            if(
                warehouseStatus === WAREHOUSE_STATUS.pendingRelease || 
                warehouseStatus === WAREHOUSE_STATUS.partiallyReleased ||
                warehouseStatus === WAREHOUSE_STATUS.released
            ) {
                if(userRole === 1048) return;
                _preventEditMode();
                return;
            }
        }

        if(transactionType === record.Type.TRANSFER_ORDER) {
            if (hasReceiptInWms) {
                _preventEditMode();
                return;
            }

            if(warehouseStatus === WAREHOUSE_STATUS.pendingRelease) {
                _preventEditMode();
                return;
            }
        }

        if(transactionType === record.Type.PURCHASE_ORDER) {
            if(
                warehouseStatus === WAREHOUSE_STATUS.pendingRelease || 
                warehouseStatus === WAREHOUSE_STATUS.released
            ) {
                var WHITELISTEDROLES_PO = PO_ROLES_WHITELIST.PARTIAL_LOCK;
                if(WHITELISTEDROLES_PO[userRole]) return true;

                _preventEditMode();
                return;
            }
        }

        if(transactionType === record.Type.WORK_ORDER) {
            if(warehouseStatus === WAREHOUSE_STATUS.released) {
                _preventEditMode();
                return;
            }
        }

        if(transactionType === record.Type.RETURN_AUTHORIZATION) {
            if(
                warehouseStatus === WAREHOUSE_STATUS.pendingRelease ||
                warehouseStatus === WAREHOUSE_STATUS.released
            ) {
                _preventEditMode();
                return;
            }
        }
        return true;
    }

    return {
        preventEditMode: preventEditMode,
    }
});