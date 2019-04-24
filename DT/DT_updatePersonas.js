/**
 *  Function run by SuiteScript that updates persona on records *
 *  @param type      {string} Execution Context automatically passed in by SuiteScript. @see nlobjContext.getExecutionContext() *
 *  @param queueid   {int} automatically passed in by SuiteScript. Unsure, but @see nlapiScheduleScript() *
 */
function DT_updatePersonas(type,queueid){

    /*
     * Notes: Every nlapiLogExecution is prefixed to make it easily searchable in the script execution log.
     *   If you want to search successful steps, the prefix is 'f'
     *   If you want to search failed steps, the prefix is 'x'
     *   Numbers signify at which step/substep the script is currently on
     * */


    /* ================================================================================== */
    /** ============================= [ Global Variables ] ============================= **/
    /* ================================================================================== */

    /** Lookup table which will store metadata (ID, record type, personas) of all records found in our searches. *
     * We use and Object of Objects instead of an Array of Objects because keys are unique, thus, preventing duplicate keys from multiple searches *
     * @type {object}
     * */
    var recordsMap = {};
    /**  'RS Marketing Persona' search reference.  This search finds all marketing personas. *
     *  @type {nlobjSearchResult[]} array of objects, each representing a persona */
    var personasArray;
    /** @type {number}  Total amount of contacts updated in the system. Non-computational, merely used for logging */
    var updated = 0;

    /* ======================================================================= */
    /** ============================= [ Logic ] ============================= **/
    /* ======================================================================= */
    nlapiLogExecution('AUDIT',' -,-,- Starting Update Marketing Personas Script -,-,- ');

    /** Part 1: Getting the data we need. */
    /* Performs the saved search to find all marketing personas */
    personasArray = nlapiSearchRecord('customrecord_mktg_persona', 607); /* 10 governance Units */
    if (personasArray) {
        nlapiLogExecution('AUDIT', 'Update Marketing Personas', 'f1- Personas Found.'+ personasArray.length +' | Names.'+ personasArray.map( function(item){ return item.getValue(item.getAllColumns()[0]) } ).join(', '));

        /* Loop through each row of the marketing personas search results to update the global records object {recordsMap}  */
        for (var row = 0; row < personasArray.length; row++) {
            searchPersonas(personasArray[row]);
            checkGovernance(130, 'Search Personas', row, personasArray.length);
        }
        nlapiLogExecution('AUDIT', 'Update Marketing Personas', 'f2- Search Done. '+ Object.keys(recordsMap).length +' unique records found | '+ usage());

        /** Part 2: Doing stuff with the data. */
        /* Now that we have all the data, we want to open each record and check if it needs to be updated in the database */
        if (Object.keys(recordsMap).length) {
            var contactsArray = convertMapToArray(recordsMap);
            nlapiLogExecution('AUDIT', 'Update Marketing Personas', 'f3- Map converted to Array. Beginning contact updates. This will take a while. | '+ usage());
            updated = updateAllContacts(contactsArray);
            nlapiLogExecution('AUDIT', 'Update Marketing Personas', 'f4- '+ updated +' contacts updated from '+ contactsArray.length +' records');
        }
        else {
            nlapiLogExecution('ERROR', 'Update Marketing Persona', 'x3- 0 records found within the returns of each persona search');
        }
    } else {
        nlapiLogExecution('ERROR', 'Update Marketing Persona', 'x0- 0 personas returned from the search ID: 496 | customrecord_mktg_persona');
    }
    nlapiLogExecution('AUDIT','=+=+=+ Update Marketing Persona COMPLETE =+=+=', updated +' contacts updated');

    /* =========================================================================== */
    /** ============================= [ Functions ] ============================= **/
    /* =========================================================================== */


    /* ============================ [ Main Functions ] =========================== */

    /** 2a- Takes in a marketing persona and performs the search associated with the persona. *
     *  Grabs all results of the search and adds their IDs to the global recordsMap object *
     * @param row           {nlobjSearchResult} One nlobjSearchResult row to iterate through *
     * @returns             {void} *
     */
    function searchPersonas(row){
        /** @namespace
         * @name    personaID   {string}    Internal ID of a RS Marketing Persona row *
         * @name    searchID    {string}    Internal ID (value) of the Persona Search *
         * @name    name        {string}    Name (value) of the Saved Persona Search. Non-computational, merely used for logging*
         * @name    recordType  {string}    Record Type (text) displayed in the column 'Search Record Type *
         */
        var personaID = row.getId();
        var searchID = row.getValue(row.getAllColumns()[1]);
        var name = row.getValue(row.getAllColumns()[0]); /* not needed except for logging */
        var recordType = row.getText(row.getAllColumns()[2]).toLowerCase();

        /* If a Persona Search exists on a persona, perform that associatedSearch */
        if(searchID) {
            nlapiLogExecution('DEBUG', 'Update Marketing Persona', '2a- PersonaID. '+ personaID +', SavedSearchID. '+ searchID +', SearchRecordType. '+ recordType +', SearchName. '+ name );
            /** @type {nlobjSearchResultSet} Object containing all the results from an associatedSearch */
            var resultSetObj = nlapiLoadSearch(recordType, searchID).runSearch(); /* 5 governance units */
            if (resultSetObj){
                /** @type {nlobjSearchResult[]}  A single array of all nlobjSearchResult objects of a associatedSearch */
                var resultsArray = getAllResults(resultSetObj); /* 10 governance units per recursive call (1 call per every 1000 results) */

                /** @type Array     A single array of integers representing the internalIDs of all records who meet the associatedSearch criteria */
                var idsOfResults = resultsArray.map(getIDs).filter(empty);
                nlapiLogExecution('DEBUG', 'Update Marketing Persona', '2b- '+ resultsArray.length +' records found | '+ (resultsArray.length - idsOfResults.length) +" records without an internal ID");

                /* Add each record to the global map */
                addRecordsToMap(idsOfResults, recordType, personaID);
            }
            else {
                nlapiLogExecution('ERROR', 'Update Marketing Persona', 'x2 Persona Search (ID.'+ searchID +') did not return any results. | '+ usage());
            }
        }
        else {
            nlapiLogExecution('ERROR', 'Update Marketing Persona', 'x2- Persona '+ personaID +' ('+ name +') does not have a saved search associated with it. | '+ usage());
        }
    }

    /** 2b- Adds the results of a persona search to our master list of records {recordsMap}
     *  Since this loop is run often and can have over 10000 results each run, performance may be an issue.
     *      Overhead is reduced by keeping assignments and conditionals owutside of the loop.
     * @param arrayOfIDs    {Array}     An array of integers representing the internalIDs of all records who meet that associated search's criteria
     * @param recordType    {string}    Record Type of the values returned from the persona search
     * @param personaID     {string}    Internal ID of a RS Marketing Persona Row *
     */
    function addRecordsToMap(arrayOfIDs, recordType, personaID){
        var oldTotal = Object.keys(recordsMap).length;
        var index = 0;
        var max = arrayOfIDs.length;
        if (recordType === 'customer'){
            nlapiLogExecution('DEBUG', 'Update Marketing Persona', '2c- Persona Search Record Type is Customer.  Searching through each customer to add all associated contacts. This may take a while. '+ usage());
            while (index < max){
                checkGovernance(130, 'Adding Customers to Map', index, max);
                addCustomerToMap(arrayOfIDs[index++], personaID); /* 5 governance units */
            }
        } else if (recordType === 'contact'){
            nlapiLogExecution('DEBUG', 'Update Marketing Persona', '2c- Persona Search Record Type is Contact. | '+ usage());
            while (index < max){
                addContactToMap(arrayOfIDs[index++], personaID);
            }
        } else {
            nlapiLogExecution('ERROR', 'Update Marketing Persona', 'x2- '+ recordType +' not supported, only contacts or customers classified as a company');
        }
        nlapiLogExecution('DEBUG', 'Update Marketing Persona', '2d- '+ (Object.keys(recordsMap).length - oldTotal) +' records added | '+ Object.keys(recordsMap).length +' unique records in total');
    }

    /** 2customer- Gets all the contacts associated with a customer who is a company (not individual) to add the contacts map *
     * Consumes 5 governance units *
     * @param customerID    {string}   Internal ID of the customer *
     * @param personaID     {string}   Internal ID of the a RS Marketing Persona Row from the master search *
     */
    function addCustomerToMap(customerID, personaID) {
        var customer = nlapiLoadRecord('customer', customerID); /* 5 governance units */
        var customerType = customer.getFieldValue('isperson'); // T = individual , F = company
        if (customerType === 'F') { //company
            var numbersOfContacts = customer.getLineItemCount('contactroles');
            if (numbersOfContacts > 0) {
                for (var row = 1; row < numbersOfContacts + 1; row++) {
                    var contactID = customer.getLineItemValue('contactroles', 'contact', row);
                    addContactToMap(contactID, personaID);
                    // nlapiLogExecution('DEBUG', 'Update Marketing Persona', '2c- Customer has contacts '+ row +'/'+ numbersOfContacts +' ID.'+ contactID);
                }
            }
        }
        else if (customerType === 'T') {
            // future code to handle if the customer type is an individual
        } else {
            nlapiLogExecution('EMERGENCY', 'Update Marketing Persona', 'x4 Netsuite changed their nlobjRecord.getFieldValue("isperson") to return something other than T/F');
        }
    }

    /** 2contact- Pushes the current persona to a contact in the map of records if . *
     * If the contact does not exist, a new metadata object is created first. *
     * @param contactID {string}   Internal ID of the contact *
     * @param personaID {string}   Internal ID of the a RS Marketing Persona Row from the master search *
     */
    function addContactToMap(contactID, personaID){
        if (recordsMap[contactID] === undefined){
            recordsMap[contactID] = {};
            recordsMap[contactID]['id'] = contactID;
            recordsMap[contactID]['recordType'] = 'contact';
            recordsMap[contactID]['personas'] = [];
        }
        if (indexOf(personaID, recordsMap[contactID]['personas']) === -1){
            recordsMap[contactID]['personas'].push(personaID);
        }
    }

    /** 4a- Takes an array of metadata of records and loops through them to update the database. *
     * @param recordsArray  {Array} An array of objects containing the metadata of a record *
     * @return {number}             Amount of contact records updated *
     */
    function updateAllContacts(recordsArray){
        var totalUpdated = 0,
            max = recordsArray.length;
        for (var i = 0; i < max; i++){
            checkGovernance(130, 'Update Record', i, max);
            // nlapiLogExecution('DEBUG', 'Update Marketing Persona', '3a- Updating Contact ID.'+ recordsArray[i]['id'] +' , Index.'+ i +'/'+ max +' | Remaining- '+ nlapiGetContext().getRemainingUsage());
            if ( updateContact(recordsArray[i]) ){  /* 15 governance units */
                totalUpdated++;
                nlapiLogExecution('DEBUG', 'Update Marketing Persona', 'f3- Contact.'+ recordsArray[i]['id'] +' updated to ['+ recordsArray[i]['personas'].join() +'] | Total updates '+ totalUpdated +' ('+ i +'/'+ max +') | '+ usage());
            }
        }
        return totalUpdated;
    }

    /** 4b- Updates one contact in the database. *
     * Consumes at least 15 governance units per record *
     * @param contact {Object}          A reference to the metadata of a contact *
     * @returns       {string|boolean}  Value of an integer if a record is submitted and updated successfully in the database. False if not *
     */
    function updateContact(contact) {
        /** @type {nlobjRecord} Object containing all field data exactly as it appears in the system */
        var record = nlapiLoadRecord('contact', contact['id']); /* 5 governance units */
        var recordPersonas = join(record.getFieldValues('custentity_persona'));
        var contactPersonas = join(contact['personas']);

        if (recordPersonas === contactPersonas) {
            //do nothing, since they are the same.
        } else {
            record.setFieldValues('custentity_persona', contact['personas']);
            return nlapiSubmitRecord(record, false, true); // 10 governance units
        }
        return false;
    }

    /** Checks the amount of governance remaining.  If there isnt enough, script is yielded and added back to the queue to be resumed later. *
     * @param threshold     {int}       Amount of governance units to be under before Yield is called *
     * @param callee        {string}    Function that was running before the script stopped. Non-computational, merely used for logging *
     * @param index         {int}       Index of the loop where the script stopped. Non-computational, merely used for logging *
     * @param total         {int}       Total number of iterations the loop should run. Non-computational, merely used for logging *
     */
    function checkGovernance(threshold, callee, index, total){
        if( nlapiGetContext().getRemainingUsage() < threshold )
        {
            nlapiLogExecution('AUDIT', '-- Update Marketing Persona --', 'Yield called during "'+ callee +'" at index '+ index +' of '+ total);
            var state = nlapiYieldScript();
            if( state.status === 'FAILURE')
            {
                nlapiLogExecution("ERROR", '!-!-! Update Marketing Persona !-!-!', "Exiting script. Yield failed due to "+ state.reason +" , Size. "+ state.size);
                throw "Failed to yield script";
            }
            else if ( state.status === 'RESUME' )
            {
                nlapiLogExecution("AUDIT", '++ Update Marketing Persona ++', "Resuming script "+ state.reason +" ,  Size. "+ state.size +" | Index "+ index + ' of '+ total);
            }
        }
    }

    /* =========================== [ Auxiliary Functions ] ======================== */

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

    /** Takes in an Object of Objects and returns an Array of Objects *
     * @param map {Object}  An object of objects*
     * @returns {Array}     An array of objects*
     */
    function convertMapToArray(map){
        var array = [],
            index = 0;
        for (var key in map) {
            array[index++] = map[key];
        }
        return array;
    }

    /** Helper function for .map that calls nlobjSearchResult.prototype.getId() on every element *
     * @param row  {nlobjSearchResult}     Current element being looped through, passed by javascript engine *
     */
    function getIDs (row){
        var internalID = row.getId();
        if (internalID === null){
            /* in a summary search, row.getID() returns null because that row's data is a summary of a subsearch.
               we have to drill down into the row's subsearch results and get the internalID from the column

               NOTE: This code REQUIRES the first column of the search is Internal ID
               */
            var intIDcolumn = row.getAllColumns()[0]; //should be Internal ID, set as first column on the Results page
            internalID = row.getValue(intIDcolumn);
        }
        return internalID;
        // return row.getId() ? row.getId() : row.getValue( row.getAllColumns()[0] ); //one-liner of above
    }

    /** Helper function for .filter that prevents records without IDs from being added *
     * @param item  {string}   Current element being looped through, passed by javascript engine *
     */
    function empty (item){
        if (item === null || item === undefined){
            return false;
        } else {
            return item.length > 0;
        }
    }

    /** Used for logging the amount of governance units remaining.  see: https://debugger.sandbox.netsuite.com/app/help/helpcenter.nl?fid=section_N3350760.html
     * @returns {string}    The amount of governance units remaining for the current script *
     */
    function usage(){
        return "Usage Remaining- "+ nlapiGetContext().getRemainingUsage();
    }

    /** The manual way to Array.prototype.indexOf that is faster than calling the Array.indexOf()
     * Performance tested with 5 different implementations on jsperf.com brought these results:
     *  Percentages that For Loop is faster than .indexOf at ops/sec:  97%, 48%, 97%, 52%, 45%
     * @param needle    {string}    What you're trying to find
     * @param haystack  {Array}     Where you want to look
     * @return {number} The index in the haystack where the needle is found.  Or -1 if not found.
     */
    function indexOf(needle, haystack) {
        var foundIndex = -1,
            max = haystack.length,
            i = 0;
        for ( ; i < max; i++){
            if (haystack[i] === needle){
                foundIndex = i;
                break;
            }
        }
        return foundIndex;
    }

    /** NetSuites nlobjRecord.prototype.getFieldValues().toString() returns one of: string || an Array with a custom accessor descriptor || null, instead of a string *
     * Therefore, we cant always use Object.prototype.toString() and must use Array.prototype.join() when it is an Array *
     * @param	value   {(Array|string)}   Any datatype (array, string, int) *
     * @returns {string}	                all values joined together, delimited by a comma *
     */
    function join(value){
        if (value === null){
            return 'value is empty';
        }
        if (typeof value === 'object'){
            return value.join();
        } else {
            return value.toString();
        }
    }
}