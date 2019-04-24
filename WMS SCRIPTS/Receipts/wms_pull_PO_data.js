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
define(['N/search', '../Libraries/global_modules.js', '../Libraries/azure_module.js'],
	/**
	  * Module params:
	  * @param {search} search
	  */
	function (search, global_modules, azure_module) {

		var max_batch_size = 1;
		var XML_TYPE = 'Receipt';

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
			return global_modules.create_batches(XML_TYPE);
		}

		/**
		* Executes when the map entry point is triggered and applies to each key/value pair.
		*
		* @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
		* @since 2015.1
		*/
		function map(context) {
			var batch = JSON.parse(context.value);
			var batch_id = global_modules.create_batch_record(batch, XML_TYPE, 'outbound');
			var fileObj = global_modules.getInputData_ByQueueRecord(XML_TYPE, batch_id)[0];
			log.debug('fileObj', JSON.stringify(fileObj));
			azure_module.azure_download(fileObj, XML_TYPE); //send batch
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
