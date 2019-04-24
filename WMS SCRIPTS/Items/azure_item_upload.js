/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-12-08      dbarnett         Created Script
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(['N/file', 'N/record', 'N/search', 'N/xml', '../Libraries/global_modules.js', '../Libraries/xml_module.js', '../AzureStorage/azure-storage.file.js'],
/**
  * Module params:
  * @param {file} file
  * @param {record} record
  * @param {search} search
  */
function(file, record, search, xml, global_modules, xml_module, AzureStorage) {

    var recordType = "itemDownload";
    var share = 'ils';
	var directory = '/Interface/KushTest/' + recordType;

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
        var fileService = AzureStorage.FileService;

        var filesToGet = fileService.listFilesAndDirectories(share, directory);
        log.debug({ title : 'filesToGet rawXML', details : filesToGet });

		var xmlDocument  = xml.Parser.fromString({
			text : filesToGet
		});

        var filesObj = xml_module.xml_2_json(xmlDocument);
        log.debug({ title : 'filesToGet Object', details : filesObj });

        if (filesObj.Entries && filesObj.Entries.File) {
			var filesArr = filesObj.Entries.File;
            
            return filesArr;
        }
        
        return [];
    }

    /**
    * Executes when the map entry point is triggered and applies to each key/value pair.
    *
    * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
    * @since 2015.1
    */
    function map(context) {

        var fileObj = JSON.parse(context.value);

        var fileName = fileObj['Name'];
       
        var fileService = AzureStorage.FileService;

        var fileText = fileService.getFileToText(share,  directory, fileName);
        log.debug({ title : 'fileText for ' + fileName, details : (fileText || '').substring(0,200) });

        processXML_toNS(fileName, fileText, fileService);
        
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


    function processXML_toNS(fileName, fileText, fileService) {
        //Convert raw XML string to xml DOM Object
        var xmlDocument  = xml.Parser.fromString({
			text : fileText
        });
        
        //Convert XML DOM to JSON object
		var fileTextObj = xml_module.xml_2_json(xmlDocument);

        //save as Custom Record , or File  //TODO
        var saveSuccess = global_modules.createInboundRec(fileTextObj, global_modules.CONSTANTS.WMS_Configs.ITEM.config_id);

        //once successfully saved into NetSuite, delete from Azure File Storage
        if(saveSuccess){
            log.debug("share directory filename", share + " " + directory + " " + fileName);
            fileService.deleteFile(share, directory, fileName);
        }
      

    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});