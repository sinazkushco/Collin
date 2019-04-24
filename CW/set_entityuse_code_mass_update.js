var scriptName = "Set Entity/Use Code => ";
var max_governance = 130;
var states_map = get_states_map();
/**
 *  Function run by SuiteScript that sets entity/use code on address records for each customer based on tax exempt states field *** 
 *  @param none **
 * @returns none **
 */

function update_entityuse_codes() {
    //create an object with all unique customers 
    nlapiLogExecution('AUDIT', ' -,-,- update entity/use codes -,-,- ');
    var array_of_customers = [];
    // var filters = [];
    // var columns = [
    //     new nlobjSearchColumn('internalid')
    // ];
    // //run SuiteScript function to grab all customer ids and put them into an array
    // var customerSearch = nlapiCreateSearch('customer', filters, columns);
    // var result_set = customerSearch.runSearch();
    array_of_customers = nlapiSearchRecord("customer", null,
        [
            ["internalidnumber", "equalto", "894942"],
            "OR",
            ["internalidnumber", "equalto", "895145"],
            "OR",
            ["internalidnumber", "equalto", "895144"]
        ],
        [
            new nlobjSearchColumn("entityid").setSort(false)
        ]
    );
    // array_of_customers = getAllResults(result_set);
    checkGovernance(max_governance, 'Create Array of Customers', 0, array_of_customers.length);
    //run SuiteScript function to loop through customer ids, check if stage is equal to lead, prospect, then setting new entity fields
    for (var i = 0; i < array_of_customers.length; i++) {
        checkGovernance(max_governance, 'Set Entity/Use Code for Customer', i, array_of_customers.length);
        set_entityuse_code(array_of_customers[i].id, i, array_of_customers.length);
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

/** Loops through all the customers addresses and checks them against their tax exempt states.*
*  Sets entity/use code if there is a match *
* @param customer_id {int} customer id *
* @param index {int} index of where we are in the customer array *
* @returns none *
*/

function set_entityuse_code(customer_id, index, total) {
    // var customer = nlapiLoadRecord('customer', customer_id.getId()); //load customer
    var customer = nlapiLoadRecord('customer', customer_id);
    nlapiLogExecution('DEBUG', customer_id);
    var length_of_address_list = customer.getLineItemCount('addressbook'); //get length of address subrecord
    var tax_exempt_states = customer.getFieldValues('custentity_tax_exempt_states'); //array of states
    for (var i = 1; i <= length_of_address_list; i++) {
        customer.selectLineItem('addressbook', i); //select address line
        var state = customer.getCurrentLineItemValue('addressbook', 'state'); //get state on address line
        nlapiLogExecution('DEBUG', 'state', state);
        var state_id = states_map[state].toString(); //get the state abbrieviations from the state map using the state internal ids
        if (tax_exempt_states.indexOf(state_id) !== -1) { //if state from address line is in states tax exempt states, set the entity/use code
            nlapiLogExecution('DEBUG', 'i made it');
            customer.setCurrentLineItemValue('addressbook', 'custpage_ava_entityusecode', '2');
            customer.commitLineItem('addressbook');
        }
    }
    try {
        checkGovernance(max_governance, 'Submitting new records', index, total);
        var success = nlapiSubmitRecord(customer, false, true);
        if (success) {
            nlapiLogExecution('AUDIT', scriptName + ' Record Saved', success);
        }
    } catch (e) {
        nlapiLogExecution('ERROR', scriptName + ' FAILED TO SAVE: ' + customer_id, JSON.stringify(e));
    }

}

function get_states_map() {
    var state_map = {
        AL: 1,
        AK: 2,
        AZ: 3,
        AR: 4,
        CA: 5,
        CO: 6,
        CT: 7,
        DE: 8,
        FL: 9,
        GA: 10,
        HI: 11,
        ID: 12,
        IL: 13,
        IN: 14,
        IA: 15,
        KS: 16,
        KY: 17,
        LA: 18,
        ME: 19,
        MD: 20,
        MA: 21,
        MI: 22,
        MN: 23,
        MS: 24,
        MO: 25,
        MT: 26,
        NE: 27,
        NV: 28,
        NH: 29,
        NJ: 30,
        NM: 31,
        NY: 32,
        NC: 33,
        ND: 34,
        OH: 35,
        OK: 36,
        OR: 37,
        PA: 38,
        RI: 39,
        SC: 40,
        SD: 41,
        TN: 42,
        TX: 43,
        UT: 44,
        VT: 45,
        VA: 46,
        WA: 47,
        WV: 48,
        WI: 49,
        WY: 50
    };
    return state_map;
}




