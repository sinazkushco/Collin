/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
define(['N/task', 'N/runtime', 'N/record', 'N/search', 'N/log'], function (task, runtime, record, search, log) {
    function execute(context) {
        log.audit("Script Progress Check: ", "Script Ran: Execution Function");
        var infoArray = []; //array of objects, will push in data in the same group
        var loopCounter = 0; //will count how many loops we go through
        var searchResultCount = 0; //will be updated to length of execution log search, is needed to compare to the loop counter
        var createCount = 0; //will be used to count how many records created
        var requestParts = {}; //container to store all the parts of the full request as keys
        var responseParts = {}; //container to store all the parts of the full request as keys

        function logSearch() {
            var currentGroup = "";

            var scriptexecutionlogSearchObj = search.create({
                type: "scriptexecutionlog",
                filters: [
                    ["scripttype", "anyof", "221"],
                    "AND", ["date", "onorafter", "yesterday"],
                    "AND", ["type", "anyof", "AUDIT"]
                ],
                columns: [
                    search.createColumn({
                        name: "title",
                        sort: search.Sort.DESC
                    }),
                    "detail",
                    "internalid"
                ]
            });

            searchResultCount = scriptexecutionlogSearchObj.runPaged().count - 1;
            log.audit("Script Progress Check: Search Results Found ", searchResultCount + 1);
            var resultSet = scriptexecutionlogSearchObj.run();
            // resultSet.each(parseResult); //deprecated because .each fails if > 4000 results
            
            var results = getAllResults(resultSet);
            results.forEach(parseResult);

            function parseResult(result) {
                var title = result.getValue({
                    name: "title"
                });
                var detail = result.getValue({
                    name: "detail"
                });

                var field = title.split(",")[1];
                var timeId = title.split(",")[0];

                var recordExist = recordCheck(timeId);

                //part of same group ID - add info to array
                if (currentGroup === timeId) {
                    combineInfo(timeId, field, detail);
                }
                //record doesnt exist and other records have been saved
                else if (!recordExist && currentGroup) {
                    createRecord();
                    combineInfo(timeId, field, detail);
                    currentGroup = timeId;
                }
                //record doesnt exist and no other records have been saved yet
                else if (!recordExist && !currentGroup) {
                    combineInfo(timeId, field, detail);
                    currentGroup = timeId;
                }
                //record existed but part of diff group
                else if (currentGroup != timeId && infoArray.length > 0) {
                    createRecord();
                }

                loopCounter++;
                //continue looping through search
                return true;
            }
        }

        function combineInfo(id, field, detail) {

            infoArray.push({
                id: id,
                field: field,
                detail: detail
            });

            //add to the corresponding container object above so we can loop through it later
            if( field.search("resp") !== -1 ) {
                responseParts[field.split("body")[1]] = detail;
            } else if( field.search("req") !== -1 ) {
                requestParts[field.split("body")[1]] = detail;
            }

            //we reached the end of the loop, so we need to create a record with whatever is left in the array
            if(loopCounter === searchResultCount) {
                createRecord();
            }
        }

        function recordCheck(id) {
            var exist = false;

            var customrecord_fedex_log_unitSearchObj = search.create({
                type: "customrecord_fedex_log_unit",
                filters: [
                    // ["custrecord_time_id", "is", id]
                    ["externalid", "is", id]
                ],
                columns: [
                    "custrecord_fedex_unit_comments"
                ]
            });

            var recordResultCount = customrecord_fedex_log_unitSearchObj.runPaged().count;

            if (recordResultCount > 0) {
                exist = true;
            }
            return exist;

        }

        /** Recursively searches a nlobjSearchResultSet or N/search.ResultSet until all results are found. *
         *  Function was made due to nlapiSearchRecord returning a limit of 1000 rows. This function can return up to 999000 results *
         *  Consumes at least 10 governance units per call *
         * @param resultSetObj  {nlobjSearchResultSet || N/search.ResultSet }  object returned from nlobjSearch.prototype.runSearch() or N/search.Search.run(); *
         * @param startIndex    [optional] {int} index of where to start the associatedSearch. start is inclusive, end is exclusive *
         * @returns {nlobjSearchResult[]}  A single array of all nlobjSearchResult objects of a associatedSearch *
         */
        function getAllResults(resultSetObj, startIndex){
            if (!startIndex){
                startIndex = 0;
            }
            var maxResultsPerCall = 1000; //for testing, change this to 100 or a value smaller than your resultSet
            var endIndex = startIndex + maxResultsPerCall;

            if (resultSetObj.getResults === undefined && typeof resultSetObj.getRange === 'function') {
                resultSetObj.getResults = resultSetObj.getRange; //in SS2.0, getResults has been renamed to getRange
            }
            var results = resultSetObj.getResults(startIndex, endIndex) || []; // 10 governance units per call
            var moreResults = results.length === maxResultsPerCall ? getAllResults(resultSetObj, endIndex) : [];
            var combinedResults = results.concat(moreResults);
            return combinedResults;

            /*  2.0 search flow
            search.create                   =>  {} = search.Search
            search.Search.run               =>  {} = search.ResultSet
            search.ResultSet.getRange       =>  [search.Result, ...]

            search.Result.getValue(column)  =>  string
            search.Result.getID(column)     =>  string
            search.Result.columns           =>  [search.Column, ...]
            */
        }

        function createRecord() {
            var requestBlob = "";
            var responseBlob = "";

            var newRecord = record.create({
                type: "customrecord_fedex_log_unit"
            });


            for( var requestKey = 1; requestKey < Object.keys(requestParts).length + 1; requestKey++ ){
                requestBlob += requestParts[requestKey];
            }

            for( var responseKey = 1; responseKey < Object.keys(responseParts).length + 1; responseKey++ ){
                responseBlob += responseParts[responseKey];
            }

            var lengthMessage = "Request Parts: "+ Object.keys(requestParts).length +" | Response Parts: "+ Object.keys(responseParts).length;
            newRecord.setValue("custrecord_fedex_log_2_req_soapbody_full", requestBlob);
            newRecord.setValue("custrecord_fedex_log_3_resp_xmlbody_full", responseBlob);
            newRecord.setValue("custrecord_fedex_log_body_lengths", lengthMessage);
            log.debug('FedEx Log Unit Creator parts compiled', lengthMessage);

            for (var i = 0; i < infoArray.length; i++) {
                newRecord.setValue(infoArray[i].field, infoArray[i].detail);
            }
            // newRecord.setValue("custrecord_time_id", infoArray[0].id)
            newRecord.setValue("externalid", infoArray[0].id);
            var success = newRecord.save();
            log.audit("FedEx Log Unit Creator ('customscript_fedex_log_unit_creator') Success", "Created customrecord_fedex_log_unit:  Internal ID: "+ success +' | External ID: '+ infoArray[0].id);

            requestParts = {};
            responseParts = {};
            infoArray = [];
            createCount++;
        }

        logSearch();
        log.audit("FedEx Log Unit Creator complete", createCount +" records created.");

    }

    return {
        execute: execute
    };
});