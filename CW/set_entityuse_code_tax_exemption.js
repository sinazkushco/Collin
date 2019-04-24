var RECORD;
var RUNTIME;
var LOG;
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */


define(['N/record', 'N/runtime', 'N/log'], set_g_entity_if_exempt);

function set_g_entity_if_exempt(record, runtime,log) {
    RECORD = record;
    RUNTIME = runtime;
    LOG = log;
    var returnObj = {};
    returnObj.beforeSubmit = beforeSubmit;
    return returnObj;
}


function beforeSubmit(context) {
    debugger;
    var current_record = context.newRecord;
    log.debug('current_record',current_record);
    var loadedRecord = RECORD.load({
        type: current_record.type,
        id: current_record.id,
        isDynamic: true,
    });
    log.debug('loadedRecord',loadedRecord);
    // var loadedRecord = record.load({
    //     type: currentRecord.type,
    //     id: currentRecord.id,
    //     isDynamic: true,
    // });
    
    var length_of_address_sublist = loadedRecord.getLineCount({
        sublistId: 'addressbook'
    });
    log.debug('length_of_address_sublist',length_of_address_sublist);
    var tax_exempt_states = loadedRecord.getText({
        fieldId: 'custentity_tax_exempt_states'
    });
    log.debug('tax_exempt_states',tax_exempt_states);
    for (var i = 0; i < length_of_address_sublist; i++) {
       
        loadedRecord.selectLine({
            sublistId: 'addressbook',
            line: i
        });
        var state = loadedRecord.getCurrentSublistValue({
            sublistId: 'addressbook',
            fieldId: 'state'
        });
        log.debug('state',state);

        if (tax_exempt_states.indexOf(state) != -1) {
            loadedRecord.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: 'custpage_ava_entityusecode',
                value: '2'
            });
            loadedRecord.commitLine({
                sublistId: 'addressbook'
            });
        }
    }
    loadedRecord.save();
    return;
}








