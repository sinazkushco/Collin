var RECORD, LOG, SEARCH;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/search'], runUserEvent);

function runUserEvent(record, log, search) {
    RECORD = record;
    LOG = log;
    SEARCH = search;
    var returnObj = {};
    returnObj.execute = execute;
    return returnObj;
}

function execute(context) {
    var USECODES = create_usecodes_map();
    var customerSearchObj = SEARCH.create({
        type: "customer",
        filters:
            [
                ["custentity_need_entityusecode_update", "is", "T"]
            ],
        columns:
            [
                "internalid"
            ]
    });
    var searchResultCount = customerSearchObj.runPaged().count;
    LOG.debug("customerSearchObj result count", searchResultCount);
    customerSearchObj.run().each(function (result) {

        var custRecord = RECORD.load({
            type: 'customer',
            id: result.getValue("internalid"),
            isDynamic: true
        });
        var tax_exempt_states = custRecord.getText({
            fieldId: 'custentity_tax_exempt_states'
        });
        log.debug('Tax exempt states', tax_exempt_states);
        if (tax_exempt_states) {
            var line_count = custRecord.getLineCount({
                sublistId: 'addressbook'
            });
            for (var i = 0; i < line_count; i++) { //loop through each address line

                custRecord.selectLine({
                    sublistId: 'addressbook',
                    line: i
                });

                var state = custRecord.getCurrentSublistValue({//grab state on the line
                    sublistId: 'addressbook',
                    fieldId: 'dropdownstate_initialvalue'
                });
                log.debug('Address Book State', state);
                if (state) {
                    var tax_code;
                    if (tax_exempt_states.indexOf(state) !== -1) { //if state on address is in tax exempt states
                        tax_code = USECODES.G;
                    } else {
                        tax_code = USECODES.TAXABLE;
                    }
                    custRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'custpage_ava_entityusecode',
                        value: tax_code,
                        ignoreFieldChange: true
                    }); //set entity use code to 2
                    custRecord.commitLine({
                        sublistId: 'addressbook'
                    });
                }
            }
            custRecord.setValue({
                fieldId:'custentity_need_entityusecode_update',
                value: false,
                ignoreFieldChange: true
            });
            try{
                var saved_record = custRecord.save();
                LOG.debug('Record Saved', saved_record);
            }catch(e){
                LOG.debug('Record did not save', e);
            }
            return true;
        }
    });
}

function create_usecodes_map() {
    return {
        Z: '2',
        G: '3',
        TAXABLE: '1'
    };
}