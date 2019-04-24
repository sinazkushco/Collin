/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-11-01      cWong            Created Script
*            2018-11-30      dbarnett         Refactoring
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['../Libraries/global_modules.js', '../Libraries/azure_module.js'],
    /**
      * Module params:
      * @param {global_modules} global_modules
      */
    function (global_modules, azure_module) {

        var XML_TYPE = 'Shipment';

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
            //create an inventory count for current location location
            var needsReview = false;
            var batch = JSON.parse(context.value);
            log.debug({title : 'firstShipmentOfBatch', details : batch.Shipments.Shipment[0] });
            try{
                global_modules.createItemFulfillment(batch);
                //context.value = JSON.stringify(batch);
            } catch (err){
                log.error('err',err);
                needsReview = err;
            }

            if(needsReview){
                global_modules.logTransformError(batch.Shipments.Shipment[0].ErpOrder, batch, needsReview, "2");
            } else {
                //var context_json = JSON.parse(context.value);
                azure_module.pull_record_data_download(batch, XML_TYPE);
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
