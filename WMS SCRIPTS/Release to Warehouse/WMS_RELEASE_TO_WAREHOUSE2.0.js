/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/global_modules.js', '../Libraries/azure_module.js', 'N/runtime', 'N/email'],
	/**
		 * Module params:
		 * @param {global_modules} global_modules
		 * @param {azure_module} azure_module
         * @param {runtime} runtime
		 */
	function (global_modules, azure_module, runtime ,email) {

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
            var script = runtime.getCurrentScript();
            var current_record = [];
            current_record.push(JSON.parse(script.getParameter({name:'custscript_payload'})));
			return current_record;
        }
        
		/**
		* Executes when the map entry point is triggered and applies to each key/value pair.
		*
		* @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
		* @since 2015.1
		*/
		function map(context) {
			var current_record = JSON.parse(context.value);
			var response = {
				success: false
			};
            var XML_TYPE = current_record.XML_TYPE;
            var current_record_id;
            if (XML_TYPE && current_record) {
                current_record_id = current_record.id;
                log.audit('current record', current_record);
                var saved_record;
                var download_success;
                var expedited = current_record.custbody_expedited_order;
                if(expedited == 'true'){
                    download_success = azure_module.on_demand_download(XML_TYPE, current_record_id);
                }
                if(download_success || saved_record){
                    response.success = true;
                }
            }
            if (!response.success) {
				log.error('wms release to warehouse failed', JSON.stringify(current_record));
				var message = 'RECORD: ' + JSON.stringify(current_record);
				//global_modules.send_error_message(message);
            }else{
                log.audit('wms release to warehouse success current_record_id', current_record_id);
            }
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