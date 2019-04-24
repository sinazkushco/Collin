/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */

define(['SuiteScripts/Library/kush_utilities.js', 'N/file'], function (kushUtils, file) {
    function onRequest(context) {
        // context.request;

        if (context.request.method == 'GET') {
            var oldCsvFile = file.load('SuiteScripts/RL/Prototypes/test.csv');
            var oldCsv = oldCsvFile.getContents();

            var newCsvFile = file.load('SuiteScripts/RL/Prototypes/4-10.csv');
            var newCsv = newCsvFile.getContents();

            var response = kushUtils.CSVToJson(newCsv)
            context.response.write(JSON.stringify(response));
        }
    }
    return {
        onRequest: onRequest
    }
});
