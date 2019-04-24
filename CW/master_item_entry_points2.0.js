/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(["require", "exports", "N/runtime", "N/currentRecord", "N/search", "/SuiteScripts/CW/ITEM_vape_filling_instructions2.0.js"], function (require, exports, runtime, current_record, search, vape_filling) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var currentRecord = current_record.get();
    var exec = runtime.executionContext;
    var role = runtime.getCurrentUser().role;
    exports.pageInit = function (context) {
        if (exec == runtime.ContextType.USER_INTERFACE) {
            var currentRecord = context.currentRecord;
            var isWarehouseForm = currentRecord.getValue('customform') == "115" ? true : false;
            if(isWarehouseForm) {return}
            var locations_line_count = currentRecord.getLineCount('locations');
            for (var i = 0; i < locations_line_count; i++) {
                var count_interval_field = currentRecord.getSublistField({
                    sublistId: 'locations',
                    fieldId: 'invtcountinterval',
                    line: i
                });
                count_interval_field.isDisabled = true;
            }
        }
    };
    exports.saveRecord = function (context) {
        var verified = true;
        if (exec == runtime.ContextType.USER_INTERFACE) {
            verified = vape_filling.confirm_vape_filling_instructions(currentRecord);
        }
        return verified;
    };
    exports.fieldChanged = function (context) {
        if (runtime.executionContext == runtime.ContextType.USER_INTERFACE) {
            if (context.sublistId == 'locations') {
                if (context.fieldId == 'invtclassification') {
                    var cycle_map_record = search.lookupFields({
                        type: 'customrecord_kch_field_controller',
                        id: '3',
                        columns: ['custrecord_custom_objects']
                    });
                    var cycle_map_object = JSON.parse(cycle_map_record.custrecord_custom_objects);
                    var classification = currentRecord.getCurrentSublistValue({
                        sublistId: 'locations',
                        fieldId: 'invtclassification',
                    });
                    var count_inverval = '';
                    if (cycle_map_object[classification]) {
                        count_inverval = cycle_map_object[classification].count_interval;
                    }
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'locations',
                        fieldId: 'invtcountinterval',
                        value: count_inverval
                    });
                } //end if classification
            } //end if location
        }
    };
});
// export let validateLine: EntryPoints.Client.validateLine = (context: EntryPoints.Client.validateLineContext) => {
//   return true;
// }
// export let lineInit: EntryPoints.Client.lineInit = (context: EntryPoints.Client.lineInitContext) => {
// }
