/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-02-19      Collin         Created Script
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/azure_module.js',"N/search",'../Libraries/global_modules.js'],
/**
  * Module params:
  * @param {azure_module} azure_module
  * @param {search} search
  */
function(azure_module,search, global_modules) {
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
        var filters = []
        filters.push(search.createFilter({
            name: 'context',
            join: 'systemnotes',
            operator: search.Operator.ANYOF,
            values: "CSV" //internalidvalue
        }))
        filters.push(search.createFilter({
            name: 'date',
            join: 'systemnotes',
            operator: search.Operator.ON,
            values: "today" //internalidvalue
        }))
        filters.push(search.createFilter({
            name: "formulanumeric",
            operator: "equalto",
            values: "0",//internalidvalue
            formula: "CASE WHEN trunc({today}) - trunc({custitem_date_last_sent_to_scale}) = 0 THEN CASE WHEN to_char({systemnotes.date},'HH24')-to_char({custitem_date_last_sent_to_scale},'HH24') > 0 THEN 0 ELSE 1 END ELSE 0 END"
        }))
        var results = global_modules.create_batches('Item', null, filters).concat(global_modules.create_batches('BillOfMaterial', null, filters));
        return results
    }

    /**
    * Executes when the map entry point is triggered and applies to each key/value pair.
    *
    * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
    * @since 2015.1
    */
    function map(context) {
        var context_json = JSON.parse(context.value);
        var XML_TYPE = Object.keys(context_json)[0]
        XML_TYPE = Object.keys(context_json[XML_TYPE])[0]
        log.debug('context_json',context_json)
        log.debug('XML_TYPE',XML_TYPE)
        azure_module.pull_record_data_download(context_json, XML_TYPE);
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
