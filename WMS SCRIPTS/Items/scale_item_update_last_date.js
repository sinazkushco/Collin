/**
* Module Description
* 
* Version    Date            Author           Remarkss
* 2.00       2018-11-28      Collin W.         Created Script
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(["N/record", "N/search","../Libraries/global_modules.js", "../Libraries/azure_module.js", "../Libraries/scale_utils.js"],
    /**
	  * Module params:
      * @param {record} record
      * @param {search} search
	  * @param {global_modules} global_modules
	  * @param {azure_module} azure_module
      * @param {scale_utils} scale_utils
	  */
    function (record, search, global_modules, azure_module, scale_utils) {

        var XML_TYPE = "Item";

        /**
		* Marks the beginning of the Map/Reduce process and generates input data.
		* @typedef {Object} ObjectRef
		* @param {InputContext} context
		* @property {number} id - Internal ID of the record instance
		* @property {string} type - Record type id
		*
		* @return {Array|Object|Search|RecordRef} inputSummary
		* @since 2015.1
		*/
        function getInputData(context) {
            
            var configInformation = scale_utils.getWMSConfig(XML_TYPE);

            var srchObj = search.load({
                id: configInformation["custrecord_wms_rec_save_search"][0].value
            });
            
            return srchObj;
        }

        /**
		* Executes when the map entry point is triggered and applies to each key/value pair.
		*
		* @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
		* @since 2015.1
		*/
        function map(context) {
            var context_json = JSON.parse(context.value);

            var item_internal_id = context_json.id;
            var record_type = context_json.recordType;
            // azure_module.pull_record_data_download(context_json, XML_TYPE);

            var now = global_modules.format_datetime(new Date());

            record.submitFields({
                type: record_type,
                id: item_internal_id,
                values: {
                    custitem_date_last_sent_to_scale: now
                },
            });

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
