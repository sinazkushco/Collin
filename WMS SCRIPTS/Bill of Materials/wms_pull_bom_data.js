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
define(['../Libraries/global_modules.js', '../Libraries/azure_module.js', 'N/task'],
	/**
		 * Module params:
		 * @param {global_modules} global_modules
		 * @param {azure_module} azure_module
		 */
	function (global_modules, azure_module, task) {

		var XML_TYPE = 'BillOfMaterial';

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
			var context_json = JSON.parse(context.value);
			azure_module.pull_record_data_download(context_json, XML_TYPE);
		}

		/**
		* Executes when the summarize entry point is triggered and applies to the result set.
		*
		* @param {SummaryContext} context - Holds statistics regarding the execution of a map/reduce script
		* @since 2015.1
		*/
		function summarize(context) {
			task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: 'customscript_scale_update_last_date_sent',
				deploymentId: 'customdeploy_update_last_date'
			}).submit()
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