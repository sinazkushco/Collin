Date.prototype.format_date = format_date;
var scriptName = "Pull Marketing Data => ";
var max_governance = 130;
/**
 *  Function run by SuiteScript that pulls data from the marketing tab and puts them into custom, searchable fields *** 
 *  @param type      {string} Execution Context automatically passed in by SuiteScript. @see nlobjContext.getExecutionContext() *
 *  @param queueid   {int} automatically passed in by SuiteScript. Unsure, but @see nlapiScheduleScript() *
 */

/** Grabs all customers and their marketing data and sets it to searchable fields *
 * @param none *
 * @returns none *
 */


function pull_field_data_from_marketing_tab() {
    //create an object with all unique customers 
    nlapiLogExecution('AUDIT', ' -,-,- Start Pulling Field Data From Marketing Tab -,-,- ');
    var array_of_customers = [];
    var filters = [];
    var columns = [
        new nlobjSearchColumn('stage'),
        new nlobjSearchColumn('internalid')
    ];
    //run SuiteScript function to grab all customer ids and stage and put them into an array
    var customerSearch = nlapiCreateSearch('customer', filters, columns);
    var result_set = customerSearch.runSearch();
    array_of_customers = getAllResults(result_set);
    checkGovernance(max_governance, 'Create Array of Customers', 0, array_of_customers.length);
    //run SuiteScript function to loop through customer ids, check if stage is equal to lead, prospect, then setting marking data to new entity fields
    for (var i = 0; i < array_of_customers.length; i++) {
        checkGovernance(max_governance, 'Set Marketing Fields for Customer', i, array_of_customers.length);
        set_marketing_fields(array_of_customers[i], i, array_of_customers.length);
    }
}

/** recordursively searches a nlobjSearchResultSet or N/search.ResultSet until all results are found. *
 *  Function was made due to nlapiSearchrecord or N/search.ResultSet.run returning a limit of 1000 rows. This function can return up to 999000 results *
 *  Consumes at least 10 governance units per call *
 *  start is inclusive, end is exclusive *
 * @param resultSetObj  {nlobjSearchResultSet || N/search.ResultSet }  object returned from nlobjSearch.prototype.runSearch() or N/search.Search.run(); *
 * @param startIndex    [optional] {int} index of where to start the associatedSearch. if not provided, starts at 0 *
 * @returns {nlobjSearchResult[]}  A single array of all nlobjSearchResult objects of a associatedSearch *
 */
function getAllResults(resultSetObj, startIndex) {
    startIndex = startIndex || 0;
    var pageSize = 1000; //for testing, change this to 100 or a value smaller than your resultSet
    var endIndex = startIndex + pageSize; //default is 1000

    if (resultSetObj.getResults === undefined && typeof resultSetObj.getRange === 'function') {
        resultSetObj.getResults = resultSetObj.getRange; //in SS2.0, getResults has been renamed to getRange
    }
    var results = resultSetObj.getResults(startIndex, endIndex) || []; // 10 governance units per call
    var moreResults = results.length === pageSize ? getAllResults(resultSetObj, endIndex) : [];
    var allResults = results.concat(moreResults);
    return allResults;
}


/** Get and set fields from marketing tab based on customer *
 * @param customer {int} customer id to get and set values for*
 * @returns none *
 */

function set_marketing_fields(customer, index, total) {//need to make this based on customer
    var customer_id = customer.getId();
    var fields_map = {
        'visits': 'custentity_visits_pulled',
        'firstvisit': 'custentity_firstvisit_pulled',
        'clickstream': 'custentity_clickstream_pulled',
        'lastpagevisited': 'custentity_lastpagevisited_pulled',
        "lastvisit": 'custentity_lastvisit_pulled'
    };
    var field_data = {};
    var record;
    try{
        record = nlapiLoadRecord(customer.getRecordType(), customer_id);
    }catch(e){
        nlapiLogExecution('DEBUG','Setting Marketing Fields','Could not load record');
    }
    if(record){
        for (var field in fields_map) {
            var value_on_record = record.getFieldValue(field);
            if (value_on_record !== null) {
                if (field === 'firstvisit' || field === 'lastvisit') {
                    value_on_record = new Date(value_on_record);
                    value_on_record = value_on_record.format_date();
                }
                record.setFieldValue(fields_map[field], value_on_record);
                field_data[field] = value_on_record;
            }
        }
    }
 
    nlapiLogExecution('DEBUG', scriptName + ' data for '+ customer_id, field + ': ' + JSON.stringify(field_data));

    try{
        checkGovernance(max_governance, 'Submitting new records', index, total);
        var success = nlapiSubmitRecord(record,false,true);
        if(success){
            nlapiLogExecution('AUDIT', scriptName + ' Record Saved', success);
        }
    }catch(e){
        nlapiLogExecution('ERROR', scriptName + ' FAILED TO SAVE: '+ customer_id, JSON.stringify(e));
    }
   
}

/** Checks the amount of governance remaining.  If there isnt enough, script is yielded and added back to the queue to be resumed later. *
 * @param threshold     {int}       Amount of governance units to be under before Yield is called *
 * @param callee        {string}    Function that was running before the script stopped. Non-computational, merely used for logging *
 * @param index         {int}       Index of the loop where the script stopped. Non-computational, merely used for logging *
 * @param total         {int}       Total number of iterations the loop should run. Non-computational, merely used for logging *
 */

function checkGovernance(threshold, callee, index, total) {
    if (nlapiGetContext().getRemainingUsage() < threshold) {
        nlapiLogExecution('AUDIT', '-- Update Marketing Persona --', 'Yield called during "' + callee + '" at index ' + index + ' of ' + total);
        var state = nlapiYieldScript();
        if (state.status === 'FAILURE') {
            nlapiLogExecution("ERROR", '!-!-! Update Marketing Persona !-!-!', "Exiting script. Yield failed due to " + state.reason + " , Size. " + state.size);
            throw "Failed to yield script";
        }
        else if (state.status === 'RESUME') {
            nlapiLogExecution("AUDIT", '++ Update Marketing Persona ++', "Resuming script " + state.reason + " ,  Size. " + state.size + " | Index " + index + ' of ' + total);
        }
    }
}

function format_date() {
    var time = this;
    return getDate(time);

    function pad(time, sigFigs) {
        sigFigs = sigFigs || 2;
        var scalar = sigFigs;
        var zeroes = "0";
        while (--scalar) {
            zeroes += "0";
        }
        return (zeroes + time).slice(sigFigs * -1);
    }
    function getDate(time) {
        return '' + pad(time.getMonth() + 1) + '/' +  pad(time.getDate()) + '/' + time.getFullYear();
    }
}


