/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */

define(['N/search', 'N/email', 'N/runtime'], function (search, email, runtime) {
    function fieldChanged(context) {
        try {
            setFinanceTransactionFields(context);
            setItemTransactionFields(context);
        } catch (error) {
            _sendErrorEmail('fieldChanged', context, error)
        }
    }

    function setFinanceTransactionFields(context) {
        // 'department' should already be populated, but is not always the case.
        var type = context.currentRecord.type;
        if (
            type === 'vendorbill' || // Bills
            type === 'vendorcredit' || // Bill Credits
            type === 'check' || // Checks
            type === 'creditcardcharge' || // Credit Cards
            type === 'creditcardrefund' // Credit Card Refunds
        ) {
            _setSublistValuesFromDepartment(context, 'expense');
            _setSublistValuesFromDepartment(context, 'item');
        }

        if (type === 'deposit') { // Deposits
            _setSublistValuesFromDepartment(context, 'other');
        }

        if (type === 'journalentry') { // Journals
            _setSublistValuesFromDepartment(context, 'line');
        }
    }

    function setItemTransactionFields(context) {
        // 'class' should already be populated, but is not always the case.
        var type = context.currentRecord.type;
        if (
            type === 'invoice' || // Invoice
            type === 'cashsale' || // Sales Receipt
            type === 'itemfulfillment' || // Item Fulfillment 
            type === 'creditmemo' || // Credit Memo
            type === 'itemreceipt' ||
            type === 'salesorder'
        ) {
            _syncClass(context, 'item');
            _setSublistValuesFromClass(context, 'item');
        }

        if (
            type === 'inventoryadjustment' || // Inventory Adjustment
            type === 'inventorytransfer' // Inventory Transfer
        ) {
            _syncClass(context, 'inventory')
            _setSublistValuesFromClass(context, 'inventory');
        }
    }

    function _syncClass(context, sublistId) {
        if (context.fieldId === 'class') {
            var classId = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'class'
            });

            var customClassId = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_item_class'
            });

            if (classId !== customClassId) {
                context.currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custcol_item_class',
                    value: classId
                });
            }

        }

        if (context.fieldId === 'custcol_item_class') {
            var classId = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'class'
            });

            var customClassId = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_item_class'
            });

            if (classId !== customClassId) {
                context.currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'class',
                    value: customClassId
                });
            }

        }
    }

    // Maps
    function _getDepartmentMap(departmentId) {
        var departmentMap = {}
        search.create({
            type: 'department',
            filters:
                [
                    ['internalidnumber', 'equalto', departmentId]
                ],
            columns:
                [
                    'custrecord_division_on_department',
                    'custrecord_department_class',
                    'custrecord_location_on_department'
                ]
        }).run().each(function (result) {
            departmentMap.DIVISION = result.getValue('custrecord_division_on_department');
            departmentMap.CLASS = result.getValue('custrecord_department_class');
            departmentMap.LOCATION = result.getValue('custrecord_location_on_department');
            return false;
        });
        return departmentMap;
    }

    function _getClassMap(classId) {
        var classMap = {}
        search.create({
            type: 'classification',
            filters:
                [
                    ['internalidnumber', 'equalto', classId]
                ],
            columns:
                [
                    "custrecord_division"
                ]
        }).run().each(function (result) {
            classMap.DIVISION = result.getValue("custrecord_division");
            return false;
        });
        return classMap;
    }

    // Setters
    function _setSublistValuesFromDepartment(context, sublistId) {
        if (context.fieldId !== 'department') return;
        var departmentId = context.currentRecord.getCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'department'
        });

        if (!departmentId) return;

        // // This must be uncommented in order to prevent setting values if a field already contains data
        // var hasDivision = context.currentRecord.getCurrentSublistValue({
        //     sublistId: sublistId,
        //     fieldId: 'cseg_division'
        // }) ? true : false;

        // var hasClass = context.currentRecord.getCurrentSublistValue({
        //     sublistId: sublistId,
        //     fieldId: 'class'
        // }) ? true : false;

        // var hasLocation = context.currentRecord.getCurrentSublistValue({
        //     sublistId: sublistId,
        //     fieldId: 'location'
        // }) ? true : false;

        var DEPARTMENT_MAP = _getDepartmentMap(departmentId);

        // !hasDivision && // if this line is active, the code will NOT set values if the field already has data.
        context.currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'cseg_division',
            value: DEPARTMENT_MAP.DIVISION
        });

        // !hasClass && // if this line is active, the code will NOT set values if the field already has data.
        context.currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'class',
            value: DEPARTMENT_MAP.CLASS
        });

        // Setting both class and item class sublist fields
        context.currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'custcol_item_class',
            value: DEPARTMENT_MAP.CLASS
        });

        // !hasLocation && // if this line is active, the code will NOT set values if the field already has data.
        context.currentRecord.setCurrentSublistValue({
            sublistId: sublistId,
            fieldId: 'location',
            value: DEPARTMENT_MAP.LOCATION
        });
    }

    function _setSublistValuesFromClass(context, sublistId) {
        if (context.fieldId === 'class' ) {
            var classId = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'class'
            })

            if (!classId) return;

            // // This must be uncommented in order to prevent setting values if a field already contains data
            // var hasDivision = context.currentRecord.getCurrentSublistValue({
            //     sublistId: sublistId,
            //     fieldId: 'cseg_division'
            // }) ? true : false;

            var CLASS_MAP = _getClassMap(classId);

            // !hasDivision &&  // if this line is active, the code will NOT set values if the field already has data.
            context.currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'cseg_division',
                value: CLASS_MAP.DIVISION
            });
        }

        if (context.fieldId === 'custcol_item_class') {
            var classId = context.currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'custcol_item_class'
            });

            if (!classId) return;

            // // This must be uncommented in order to prevent setting values if a field already contains data
            // var hasDivision = context.currentRecord.getCurrentSublistValue({
            //     sublistId: sublistId,
            //     fieldId: 'cseg_division'
            // }) ? true : false;

            var CLASS_MAP = _getClassMap(classId);

            // !hasDivision &&  // if this line is active, the code will NOT set values if the field already has data.
            context.currentRecord.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'cseg_division',
                value: CLASS_MAP.DIVISION
            });

        }
    }

    function _sendErrorEmail(entryPoint, context, error) {
        var user = runtime.getCurrentUser().name,
            role = runtime.getCurrentUser().role,
            recordType = context.currentRecord.type,
            recordId = context.currentRecord.id;

        email.send({
            author: 358183,
            recipients: 358183,
            subject: 'An error has occured with '+entryPoint+' on the Auto-Populate script',
            body: '<p><b>User</b>: '+user+'</p>' +
            '<p><b>Role</b>: '+role+'</p>' +
            '<p><b>Record Type</b>: '+recordType+'</p>' +
            '<p><b>Record Id</b>: '+recordId+'</p>' +
            '<pre>'+JSON.stringify(error, null, 4)+'</pre>'
        })
    }

    return {
        fieldChanged: fieldChanged
    }
});
