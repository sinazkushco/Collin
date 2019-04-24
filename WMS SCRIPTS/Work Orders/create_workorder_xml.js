/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-11-01      cWong            Created Script
* 2.00       2018-11-29      dbarnett         Refactoring
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 */
define(['N/file', 'N/record', 'N/search', '../Libraries/global_modules.js'],
/**
  * Module params:
  * @param {file} file
  * @param {record} record
  * @param {search} search
  */
function(file, record, search, global_modules) {

    /**
    * Marks the beginning of the Map/Reduce process and generates input data.
    *
    * @typedef {Object} ObjectRef
    * @param {InputContext} context
    * @property {number} id - Internal ID of the record instance
    * @property {string} type - Record type id
    *
    * @return {Array|Object|Search|RecordRef} inputSummary
    * @since 2015.1
    */
    function getInputData(context) {
        return search.load({
            id: 'customsearch_wms_workorder_queue_records'
        });
    }

    /**
    * Executes when the map entry point is triggered and applies to each key/value pair.
    *
    * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
    * @since 2015.1
    */
    function map(context) {
       
        var searchResult = JSON.parse(context.value);
        var record_json = JSON.parse(searchResult.values.custrecord_wms_json);
        
        global_modules.create_xml(record_json, searchResult.id, 'WorkOrder');
        
    }

    /**
    * Executes when the summarize entry point is triggered and applies to the result set.
    *
    * @param {SummaryContext} context - Holds statistics regarding the execution of a map/reduce script
    * @since 2015.1
    */
    function summarize(context) {
        context.mapSummary.errors.iterator().each(function (key, value) {
            log.error(key, value);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});