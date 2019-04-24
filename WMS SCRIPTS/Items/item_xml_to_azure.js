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
define(['N/file', 'N/record', 'N/search', '../Libraries/global_modules.js', '../AzureStorage/azure-storage.file.js'],
/**
  * Module params:
  * @param {file} file
  * @param {record} record
  * @param {search} search
  */
function(file, record, search, global_modules, AzureStorage) {

    var share = 'ils';
	var directory = '/Interface/KushTest/itemDownload';
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
        //var results = getInputData_ByFile();
        var configInformation = global_modules.getWMSConfig(XML_TYPE);
        var search_id =  configInformation.custrecord_queue_record_search[0].value;
        var results = global_modules.getInputData_ByQueueRecord(search_id);

        log.debug({ title: 'resultsLength', details: results.length });

        var fileNames = results.map(function(fl) {
            return fl.name;
        });
        log.debug({ title: 'fileNames', details: fileNames });
        log.debug('results', results);
       return results;
       //return [];
    }

    /**
    * Executes when the map entry point is triggered and applies to each key/value pair.
    *
    * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
    * @since 2015.1
    */
    function map(context) {

        var fileObj = JSON.parse(context.value);
       
        var fileService = AzureStorage.FileService;

        fileService.createFileFromText(share, directory, fileObj.name, fileObj.text);
        
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


    // function getInputData_ByQueueRecord(search_id) {
    //     var srchObj = search.load({
    //         id: search_id
    //     });
        
    //     /**
    //      * @type {Result[]} all results of passed search object
    //      */

    //     var results = global_modules.getAllResults(srchObj);

    //     return results.map(function (res) {
    //         var xml_obj = JSON.parse(res.getValue({ name : 'custrecord_wms_json'}));
    //         var xml_string = global_modules.json_2_xml(xml_obj).replace(/&(?!amp;)/g, '&amp;');
    //         log.debug('res', JSON.stringify(res));
    //         log.debug('get value',res.getValue({ name : 'custrecord_wms_record_type'}));
    //         log.debug('res.id',res.id);
    //         return {
    //             name : global_modules.generateFileName(res.id, res.getValue({ name : 'custrecord_wms_record_type'})),
    //             text : xml_string
    //         };
    //     });
    // }
    // function getInputData_ByFile() {
    //     var srchObj = search.load({
    //         id: 'customsearch_wms_receipt_files'
    //     });

    //     /**
    //      * @type {Result[]} all results of passed search object
    //      */
    //     var results = global_modules.getAllResults(srchObj);

    //     return results.map(function (res) {
    //         var fileObj = file.load({
    //             id : res.getValue({ name : 'internalid', join : 'file'})
    //         });

    //         return {
    //             name : res.getValue({ name : 'name', join : 'file'}),
    //             text : fileObj.getContents()
    //         };
    //     });
    // }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
