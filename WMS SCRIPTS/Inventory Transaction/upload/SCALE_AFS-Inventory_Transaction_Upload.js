/**
* Module Description
*
* Version    Date            Author           Remarks
* 2.00       2018-01-03      Donald Tran      Imported script to WMS.git from JIRA.git
*
*/
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../../AzureStorage/config.json
 */
define([
    "N/file", "N/record", "N/search", "N/xml", "N/task", "../../Libraries/global_modules.js", "../../Libraries/xml_module.js", "../../AzureStorage/azure-storage.file.js"
],
/**
     * Module params:
     * @param {file} file
     * @param {record} record
     * @param {search} search
     * @param {xml} xml
     * @param {task} task
     * @param {*} global_modules
     * @param {*} xml_module
     * @param {*} AzureStorage
     */
function (
    file, record, search, xml, task, global_modules, xml_module, AzureStorage
) {

    var constants = global_modules.CONSTANTS.WMS_Configs.INVENTORYTRANSACTION;
    var share = constants.UPLOAD.share;
    var directory = constants.UPLOAD.directory;

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

        var xmlDocument = xml.Parser.fromString({
            text: filesToGet
        });

        var filesObj = xml_module.xml_2_json(xmlDocument);
        log.audit({ title: "Inventory Transaction START", details: filesObj });

        var filesArr = [];
        if (filesObj.Entries && filesObj.Entries.File) {
            var files = filesObj.Entries.File;

            filesArr = files instanceof Array ? files : [files];

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

        var fileName = fileObj["Name"];

        var fileService = AzureStorage.FileService;

        var fileText = fileService.getFileToText(share, directory, fileName);

        processXML_toNS(fileName, fileText, fileService);

    } //map

    /**
        * Executes when the summarize entry point is triggered and applies to the result set.
        *
        * @param {SummaryContext} context - Holds statistics regarding the execution of a map/reduce script
        * @since 2015.1
        */
    function summarize(context) {
        context.mapSummary.errors.iterator().each(function (key, value) {
            log.error(key, value);
            try{
                global_modules.send_error_email("Azure Consumption Error " + key, JSON.stringify(value));
            } catch (sumErr) {
                log.error("Error Email Failed To Send", sumErr);
            }
            return true;
        });
        global_modules.callNextMapScript("customscript_azure_shipment_inbound", "customdeploy_azure_shipment_inbound_now", task); //COMMENT THIS OUT to turn off chaining
    } //summarize


    function processXML_toNS(fileName, fileText, fileService) {
        //Convert raw XML string to xml DOM Object, DOM to JSON object
        var xmlDocument = xml.Parser.fromString({ text: fileText });
        var fileTextObj = xml_module.xml_2_json(xmlDocument);

        // Pass direction as additional param --> global_modules.CONSTANTS.DIRECTION --> { INBOUND : 1, OUTBOUND : 2 }
        var queueRecordId = global_modules.create_batch_record(fileTextObj, "inventorytransaction", "inbound");

        //once successfully saved into NetSuite, delete from Azure File Storage
        if (queueRecordId) {
            fileService.deleteFile(share, directory, fileName);

            ////////////////////////////////  LOGIC STARTS HERE  /////////////////////////////////////////////////
            try {

                // var example = {
                //     "WMWDATA": {
                //         "WMFWUpload": {
                //             "Date": "2019-01-15T02:41:17.3111385Z",
                //             "GroupIndex": "1",
                //             "Id": "647b2585-81fb-4a94-b682-83a25ccad4fb",
                //             "NumGroups": "2",
                //             "NumRecs": "1",
                //             "TransHistories": {
                //                 "TransactionHistory": {
                //                     "DateTimeStamp": "2019-01-15T02:40:23",
                //                     "ProcessStamp": "f304d65a-060b-43ee-8109-1b5be5cdb176",
                //                     "UserStamp": "avazquez",
                //                     "ActivityDateTime": "2019-01-15T02:40:23",
                //                     "AfterAllocQty": "5.00000",
                //                     "AfterExpDate": "4712-12-31T00:00:00",
                //                     "AfterInTransitQty": "0.00000",
                //                     "AfterOnHandQty": "10.00000",
                //                     "AfterSts": "Available",
                //                     "AfterSuspenseQty": "0.00000",
                //                     "BeforeAllocQty": "0.00000",
                //                     "BeforeExpDate": "4712-12-31T00:00:00",
                //                     "BeforeInTransitQty": "0.00000",
                //                     "BeforeOnHandQty": "10.00000",
                //                     "BeforeSts": "Available",
                //                     "BeforeSuspenseQty": "0.00000",
                //                     "Company": "Kush Supply Co.",
                //                     "Direction": "From",
                //                     "InternalID": "1235",
                //                     "InternalKeyID": "0",
                //                     "Item": "1000212-000000",
                //                     "Location": "53-12-01-A",
                //                     "Quantity": "5.00000",
                //                     "QuantityUM": "Eaches",
                //                     "ReferenceID": "104",
                //                     "ReferenceLineNum": "0.00000",
                //                     "ReferenceType": "Samples Transfer",
                //                     "ToCompany": "Kush Bottles US",
                //                     "ToWarehouse": "CA-GG",
                //                     "TransactionType": "60",
                //                     "TransactionTypeDescription": "Inventory transfer",
                //                     "UploadInterfaceBatch": "63e1358a-2625-44b7-9aff-f22b05698e3b",
                //                     "UserName": "avazquez",
                //                     "Warehouse": "CA-GG",
                //                     "WorkZone": "W-Chapman Floor"
                //                 }
                //             }
                //         }
                //     }
                // };
                //fileTextObj = example;

                var result = global_modules.process_inventorytransaction_STR(fileTextObj, queueRecordId, false);
                var logtitle = result.success
                    ? "On Demand -> Successful consume/process/reprocess summary"
                    : "On Demand -> ERROR";

                log.audit({title: logtitle, details: result.data});


            } catch (error) {
                log.error({ title: "On Demand -> ERROR CAUGHT WTF", details: error });
            }
        } //process xml to ns json

    }


    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});