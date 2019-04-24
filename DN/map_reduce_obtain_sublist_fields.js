/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(["N/error",
    "N/record",
    "N/file"
],
    /**
     * @param {error} error
     * @param {record} record
     * @param {file} file
    */
    function (error, record, file) {
        function getInputData() {
            var FOLDER = {
                CONFIG: "1253847" // Production Config Folder ID
            } 

            return [{
                recordType: "salesorder",
                sublistType: "item",
                fileName: "so_item_sublist_fields.js",
                folderId: FOLDER.CONFIG,
                additionalBodyFields: ["billaddresslist", "messagesel", "message", "job", "memo", "custbody_transaction_reference", "otherrefnum", "discountitem", "custbody_avashippingcode", 'cseg_division', 'custbody2', 'intercotransaction', 'custbody_order_billing_shipping_addres', 'custbody_orderlines_html', 'opportunity', 'shipcarrier']
            }, {
                recordType: "salesorder",
                sublistType: "item",
                fileName: "sample_order_item_sublist_fields.js",
                folderId: FOLDER.CONFIG,
                formType: "169", // Optional property
                additionalBodyFields: ["billaddresslist", "messagesel", "message", "job", "memo", "custbody_transaction_reference", "otherrefnum", "discountitem", "custbody_avashippingcode", 'cseg_division', 'custbody2', 'intercotransaction', 'custbody_order_billing_shipping_addres', 'custbody_orderlines_html', 'opportunity', 'shipcarrier']
            }, {
                recordType: "purchaseorder",
                sublistType: "item",
                fileName: "po_item_sublist_fields.js",
                folderId: FOLDER.CONFIG
            }];
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
        */
        function map(context) {
            context = JSON.parse(context.value);

            var recordType = context.recordType,
                sublistType = context.sublistType,
                fileName = context.fileName,
                folderId = context.folderId,
                formType = context.formType || null,
                additionalBodyFields = context.additionalBodyFields

            var rec = record.create({
                type: recordType,
                isDynamic: true
            });

            // If formtype is passed from getInputData, set the record to the appropriate form, otherwise use default form
            formType && rec.setValue('customform', formType)

            var bodyFields = rec.getFields();
            var sublistFields = rec.getSublistFields(sublistType);

            var fieldsObj = {};
            fieldsObj['body'] = additionalBodyFields ? bodyFields.concat(additionalBodyFields) : bodyFields;
            fieldsObj[sublistType] = sublistFields;

            var fileObj = file.create({
                name: fileName,
                fileType: file.Type.JAVASCRIPT,
                contents: createFileContent(fieldsObj),
                folder: folderId
            });

            fileObj.save();
        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            log.debug("Summary Time", "Total Seconds: " + summary.seconds);
            log.debug("Summary Usage", "Total Usage: " + summary.usage);
            log.debug("Summary Yields", "Total Yields: " + summary.yields);

            log.debug("Input Summary: ", JSON.stringify(summary.inputSummary));
            log.debug("Map Summary: ", JSON.stringify(summary.mapSummary));
            log.debug("Reduce Summary: ", JSON.stringify(summary.reduceSummary));

            //Grab Map errors
            summary.mapSummary.errors.iterator().each(function (key, value) {
                log.error(key, "ERROR String: " + value);
                return true;
            });

        }

        function createFileContent(obj) {
            obj = JSON.stringify(obj, null, 8);

            var fileContent = "";
                fileContent += "/** \n";
                fileContent += "* @NApiVersion 2.0 \n";
                fileContent += "* @NModuleScope SameAccount \n";
                fileContent += "*/ \n";
                fileContent += "define([], function() {\n";
                fileContent += "\treturn ";
                fileContent += obj;
                fileContent += "\n\t;});";

            return fileContent;
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });