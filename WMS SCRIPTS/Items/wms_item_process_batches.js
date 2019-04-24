/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-12-12      Collin         Created Script
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/azure_module.js'],
/**
  * Module params:
  * @param {azure_module} azure_module
  */
function(azure_module) {

    var XML_TYPE = 'Item';
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
        var results = azure_module.get_queue_record_data_downloads(XML_TYPE);
        return results;
    }

    /**
    * Executes when the map entry point is triggered and applies to each key/value pair.
    *
    * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
    * @since 2015.1
    */
    function map(context) {
        var fileObj = JSON.parse(context.value);
        azure_module.azure_download(fileObj, XML_TYPE);
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
