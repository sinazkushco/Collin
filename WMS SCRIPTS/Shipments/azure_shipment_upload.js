/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 2.00       2018-12-08      Dennis N.         Created Script
 *
 */
/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(["N/file", "N/record", "N/search", "N/xml", "../Libraries/global_modules.js", "../Libraries/xml_module.js", "../AzureStorage/azure-storage.file.js", "N/log", "../Libraries/scale_constants.js"],
    /**
     * Module params:
     * @param {file} file
     * @param {record} record
     * @param {search} search
     */
    function (file, record, search, xml, global_modules, xml_module, AzureStorage, log, constants) {

        // var recordType = "shipmentUpload";
        var share = "ils";
        // var directory = "/Interface/KUSHTest/" + recordType;
        var directory = constants.WMS_Configs.SHIPMENT.UPLOAD.directory;

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
            log.debug({
                title: "filesToGet Object",
                details: filesObj
            });

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
            //log.debug({ title : 'fileText for ' + fileName, details : (fileText || '').substring(0,200) });

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
                try{
                    global_modules.send_error_email("Azure Consumption Error " + key, JSON.stringify(value));
                } catch (sumErr) {
                    log.error("Error Email Failed To Send", sumErr);
                }
                return true;
            });
        }


        function processXML_toNS(fileName, fileText, fileService) {
            //Convert raw XML string to xml DOM Object, DOM to JSON object
            var xmlDocument = xml.Parser.fromString({
                text: fileText
            });

            //This block of code removes any NestedContainer tags
            var element = xmlDocument.getElementsByTagName("NestedContainers");
            if (element.length > 0) {

                for (var index = element.length - 1; index >= 0; index--) {
                    element[index].parentNode.removeChild(element[index]);
                }

                var saveLargeFilesDirectory = "/Interface/Large Files to Process";
                fileService.createFileFromText(share, saveLargeFilesDirectory, fileName, fileText);

            }

            var fileTextObj = xml_module.xml_2_json(xmlDocument);

            var queueRecordId = global_modules.create_batch_record(fileTextObj, "shipment", "inbound");

            if (queueRecordId) {
                fileService.deleteFile(share, directory, fileName);
            }

            try {
                var fulId = global_modules.updateItemFulfillment(fileTextObj);
                record.submitFields({
                    type: "customrecord_wms_queue_records",
                    id: queueRecordId,
                    values: {
                        custrecord_wms_status: "3", // Complete
                        custrecord_wms_netsuite_record: fulId
                    }
                });
            } catch (e) {
                log.debug({
                    title: "ERROR",
                    details: e
                });

                try {
                    record.submitFields({
                        type: "customrecord_wms_queue_records",
                        id: queueRecordId,
                        values: {
                            custrecord_wms_status: "2", //TODO : update global_modules
                            custrecord_error_message: JSON.stringify(e),
                            custrecord_wms_netsuite_record: parseInt(fileTextObj.WMWDATA.WMFWUpload.Shipments.Shipment.UserDef7)
                        },
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });
                } catch (e2) {
                    record.submitFields({
                        type: "customrecord_wms_queue_records",
                        id: queueRecordId,
                        values: {
                            custrecord_wms_status: "2", //TODO : update global_modules
                            custrecord_error_message: JSON.stringify(e)
                        },
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });
                }


            }
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });