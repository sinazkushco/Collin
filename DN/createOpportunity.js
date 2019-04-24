/**
 * The purpose of this script is to create an opportunity when someone fills out an Act-On form.
 *  This script triggers off a webservice user note record - on create
 *  Update customer phone number, email, and address from contact record
 *  Also creates opportunity for the customer
 * */


/** GLOBAL VARIABLES **/
var locationId = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location") //"6"; //defaults the location to Santa Ana
var salesrepId = "977854"; //defaults to Matt Swift - 11/13/2018

/**
 * Activates only on note creation that originates from acton form submissions.
 *
 * Function also pulls information from the contact record and updates the lead(customer) record.
 * Function also calls a createOpportunity function.
 *
 * entry point fires when the create operation on a note record occurs
 * @param   type    string      write operation type: {create edit delete *xedit *approve *reject *cancel *pack *ship *dropship *specialorder *orderitems *paybills}
 */
function afterSubmit_createOpportunity(type) {
    nlapiLogExecution("Audit", "Create Opportunity", "after submit initiated");
    var context = nlapiGetContext();
    var exec = context.getExecutionContext();

    /*
    	//debug
    	if (exec !== "scheduled") {
            var debugContext = [context.getExecutionContext(), context.getName(), context.getRoleId(), context.getEmail(), context.getContact(), context.getUser()].toString();
            nlapiLogExecution('DEBUG', 'Context Check', debugContext);
    	}
    */

    try{
        if (exec === "webservices") {
            nlapiLogExecution("Audit", "Create Opportunity", "Web Services");
            var newRecord = nlapiGetNewRecord();
            var direction = newRecord.getFieldValue("direction") || 0;
            if (direction === "1") {
                nlapiLogExecution("Audit", "Create Opportunity", "Direction is 1");
                var actOnSource = newRecord.getFieldValue("title");
    
                //loads contact record, or aborts script
                var contactID = newRecord.getFieldValue("entity");
                var contactRecord = nlapiLoadRecord("contact", contactID);
                if (!contactRecord) {
                    nlapiLogExecution("ERROR", "Create Opportunity", "No contact record found for " + contactID);
                    return;
                }
    
                //loads lead record, or aborts script
                var leadID = contactRecord.getFieldValue("oldparent");
                if (!leadID) {
                    nlapiLogExecution("ERROR", "Create Opportunity", "No leadID found for contact " + contactID);
                    return;
                }
                var leadRecord = nlapiLoadRecord("customer", leadID);
                if (!leadRecord) {
                    nlapiLogExecution("ERROR", "Create Opportunity", "No lead record found for " + leadID);
                    return;
                }
    
                var leadEmail = leadRecord.getFieldValue("email");
                var leadPhone = leadRecord.getFieldValue("phone");
                // var leadAddress = leadRecord.getFieldValue("defaultaddress");
                var leadTerritory = leadRecord.getFieldValue("territory");
                var contactNotes = (contactRecord.getFieldValue("custentity_notes") || "").substring(0, 999);
                var leadSalesRep = leadRecord.getFieldValue("salesrep");
                var territory = "";
    
                try{
                    if(nlapiLookupField("employee", leadSalesRep, "isinactive") == "T"){
                        leadSalesRep = "1179758"; // Customer Support Team
                    }
                } catch(e){
                    nlapiLogExecution("Audit", "Create Opportunity", "Reassigning Inactive Rep Failed");
                }
    
    
                //if customer with existing information
                if (leadSalesRep && leadSalesRep != "1179758") {
                    nlapiLogExecution("Audit", "Create Opportunity", "Leadsales rep exist and does not belong to house");
    
                    salesrepId = leadSalesRep;
                    territory = leadTerritory;
                    locationId = nlapiLookupField('employee', leadSalesRep, 'location');
                    //new customer
                } else {
                    nlapiLogExecution("Audit", "Create Opportunity", "New customer");
                    territory = findTerritory(contactRecord);
                    leadRecord.setFieldValue("salesrep", salesrepId);
                    leadRecord.setFieldValue("custentity_customer_type", "3");
                    updateEmployeeLeadDate(salesrepId);
                    nlapiLogExecution("Audit", "Create Opportunity", "New customer functions ran fine");
                }
    
                //updates fields on the lead record
                var emailUpdated = "",
                    phoneUpdated = "",
                    addressUpdated = "",
                    territoryUpdated = "";
                if (leadEmail === null || leadEmail === "") {
                    emailUpdated = updateEmail(leadRecord, contactRecord);
                    nlapiLogExecution("Audit", "Create Opportunity", "Email Updated");
                }
                if (leadPhone === null || leadPhone === "") {
                    phoneUpdated = updatePhone(leadRecord, contactRecord);
                    nlapiLogExecution("Audit", "Create Opportunity", "Phone Updated");
                }
                // if (leadAddress === null || leadAddress === "") {
                //     addressUpdated = updateAddress(leadRecord, contactRecord); //submits contact if its canadian
                //     nlapiLogExecution("Audit", "Create Opportunity", "Address Updated");
                // }
                if (territory && leadTerritory === null || leadTerritory === "") {
                    territoryUpdated = updateTerritory(leadRecord, territory);
                    nlapiLogExecution("Audit", "Create Opportunity", "Territory Updated");
                }
    
                //lead updated
                var success = nlapiSubmitRecord(leadRecord);
                if (success) {
                    nlapiLogExecution('AUDIT', 'Create Opportunity - Lead Record Updated', 'Lead Record ' + success + ' successfully updated. ' + emailUpdated + ' ' + phoneUpdated + ' ' + addressUpdated + ' ' + territoryUpdated);
                } else {
                    nlapiLogExecution('ERROR', 'Create Opportunity - Failed to update Contact Record', 'Contact Record failed to update country to CANADA.');
                }
                checkForDuplicate(leadID, actOnSource, contactNotes);
                //createOpportunity(leadID, actOnSource, contactNotes);
            }
        }
    }catch(e){
        nlapiLogExecution("Error", e)
    }

}


////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////LOGIC///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/**	updates the address on the lead record (customer) with values from the contact record
 *
 * @param leadRecord		{nlobjRecord}	customer record
 * @param contactRecord		{nlobjRecord}	contact record
 */
function updateAddress(leadRecord, contactRecord) {
    nlapiLogExecution("Audit", "Create Opportunity", "Update Address Called");
    var contactCountry, contactAttention, contactAddressee, contactAddressPhone, contactAddress1, contactAddress2, contactCity, contactState, contactZip;
    var i = 1;

    try {
        var numberOfContacts = nlapiGetLineItemCount('addressbook');
        if (numberOfContacts > 1) {
            for (i; i < numberOfContacts; i++) {
                if (nlapiGetLineItemValue('addressbook', 'defaultshipping', i) === "T") {
                    break;
                    //tries to find the default shipping address set on the record if there are more than one address on the contact, else it uses the most recently created
                }
            }
        }
    } catch (e) {
        nlapiLogExecution('ERROR', 'Create Opportunity', 'check the addressbook sublist of the contact record ' + contactRecord.getId());
    }

    contactRecord.selectLineItem("addressbook", i);
    contactAttention = contactRecord.getCurrentLineItemValue("addressbook", "attention") || "";
    contactAddressee = contactRecord.getCurrentLineItemValue("addressbook", "addressee") || "";
    contactAddressPhone = contactRecord.getCurrentLineItemValue("addressbook", "addrphone") || "";
    contactAddress1 = contactRecord.getCurrentLineItemValue("addressbook", "addr1") || "";
    contactAddress2 = contactRecord.getCurrentLineItemValue("addressbook", "addr2") || "";
    contactCity = contactRecord.getCurrentLineItemValue("addressbook", "city") || "";
    contactState = contactRecord.getCurrentLineItemValue("addressbook", "state") || "";
    contactZip = contactRecord.getCurrentLineItemValue("addressbook", "zip") || "";
    contactCountry = contactRecord.getCurrentLineItemValue("addressbook", "country") || "";

    leadRecord.selectNewLineItem("addressbook");
    leadRecord.setCurrentLineItemValue("addressbook", "label", "Address pulled from contact record"); //zip
    leadRecord.setCurrentLineItemValue("addressbook", "attention", contactAttention); //attention
    leadRecord.setCurrentLineItemValue("addressbook", "addressee", contactAddressee); //name of person
    leadRecord.setCurrentLineItemValue("addressbook", "addrphone", contactAddressPhone); //phone # specifically for address
    leadRecord.setCurrentLineItemValue("addressbook", "addr1", contactAddress1); //address for line 1
    leadRecord.setCurrentLineItemValue("addressbook", "addr2", contactAddress2); //address for line 2
    leadRecord.setCurrentLineItemValue("addressbook", "city", contactCity); //city
    leadRecord.setCurrentLineItemValue("addressbook", "state", contactState); //state
    leadRecord.setCurrentLineItemValue("addressbook", "zip", contactZip); //zip
    if (checkCanada(contactZip)) {
        nlapiLogExecution("Audit", "Create Opportunity", "Canada Zip Met");
        contactCountry = "CA";
        salesrepId = "36250"; //Canada Ryan Lorenzen
        if (contactRecord.getCurrentLineItemValue('addressbook', 'country') !== "CA") {
            contactRecord.setCurrentLineItemValue("addressbook", "country", contactCountry);
            contactRecord.commitLineItem("addressbook");
            //contactRecord.setFieldValue("salesrep", salesrepId);
            var success = nlapiSubmitRecord(contactRecord);
            if (success) {
                nlapiLogExecution('AUDIT', 'Create Opportunity - Contact Record Updated with Canada', 'Contact Record ' + success + ' successfully updated country to CANADA.');
            } else {
                nlapiLogExecution('ERROR', 'Create Opportunity - Failed to update Canada on Contact Record', 'Contact Record failed to update country to CANADA.');
            }
        }
    }
    nlapiLogExecution("Audit", "Create Opportunity", "Lead record address set inside update address function");
    leadRecord.setCurrentLineItemValue("addressbook", "country", contactCountry); //attention

    leadRecord.commitLineItem("addressbook"); //saves
    return "address";
}

/**	updates the email on the lead record (customer) with values from the contact record
 *
 * @param leadRecord		{nlobjRecord}	customer record to update
 * @param contactRecord		{nlobjRecord}	contact record to pull data from
 * @return 					{string}		email that was set
 */
function updateEmail(leadRecord, contactRecord) {
    var contactEmail;
    contactEmail = contactRecord.getFieldValue("email");
    leadRecord.setFieldValue("email", contactEmail);
    return contactEmail;
}

/** updates the phone on the lead record (customer) with values from the contact record
 *
 * @param leadRecord		{nlobjRecord}	customer record to update
 * @param contactRecord		{nlobjRecord}	contact record to pull data from
 * @return 					{string}		phone that was set
 */
function updatePhone(leadRecord, contactRecord) {
    var contactPhone;
    contactPhone = contactRecord.getFieldValue("phone");
    leadRecord.setFieldValue("phone", contactPhone);
    return contactPhone;
}

/**	updates the territory on the lead record (customer) with values from the contact record
 *
 * @param leadRecord		{nlobjRecord}	customer record to update
 * @param territoryId		{string}		territory internal ID
 * @return 					{string}		territory that was set
 */
function updateTerritory(leadRecord, territoryId) {
    leadRecord.setFieldValue("territory", territoryId);
    return territoryId;
}

/**	creates an opportunity record and attaches it to the Lead
 *
 * @param leadID		{string}	customer internal ID
 * @param actOnSource	{string}    Act-On Provided Form Source. Ex: Custom Cannabis Form Submission
 * @param notes 		{string}	contactRecord used to get the notes from.
 */
function createOpportunity(leadID, actOnSource, notes) {
    nlapiLogExecution("Audit", "Create Opportunity", "createOpportunity called");
    var now = new Date();
    var monthInMS = 2592000000;
    var nextMonthInMS = now.getTime() + monthInMS;

    var NextMonth = new Date(nextMonthInMS);
    var expectedDate = (NextMonth.getMonth() + 1) + "/" + NextMonth.getDate() + "/" + NextMonth.getFullYear();

    var opportunity;
    opportunity = nlapiCreateRecord('opportunity');
    opportunity.setFieldValue("salesrep", salesrepId); //519 is house account
    opportunity.setFieldValue("memo", notes); //santa ana
    
    // TEMP FIX FOR MAKING SANTA ANA INACTIVE 7/14/2018
    if(locationId == "1"){
        locationId = nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location"); //"6";
    }
    opportunity.setFieldValue("location", locationId);
    opportunity.setFieldValue("entity", leadID);
    opportunity.setFieldValue("title", actOnSource);
    opportunity.setFieldValue("expectedclosedate", expectedDate);
    var success = nlapiSubmitRecord(opportunity);
    if (success) {
        nlapiLogExecution('AUDIT', 'Create Opportunity - Opportunity created', 'Opportunity Record ' + success + ' successfully created.');
    } else {
        nlapiLogExecution('EMERGENCY', 'Create Opportunity - Failed to create opportunity', 'Opportunity Record did not create.');
    }
}

function checkForDuplicate(custID, title, memo) {
    nlapiLogExecution('AUDIT', 'check for duplicate function', 'function called');
    var memoArray = [];
    var opportunitySearch = nlapiSearchRecord("opportunity", null, [
        ["customer.internalidnumber", "equalto", custID],
        "AND", ["datecreated", "within", "today"],
        "AND", ["title", "is", title]
    ], [
        new nlobjSearchColumn("title", null, null),
        new nlobjSearchColumn("memo", null, null)
    ]);

    //no results found
    if (opportunitySearch == null) {
        nlapiLogExecution('AUDIT', 'check for duplicate function', 'no results found');
        createOpportunity(custID, title, memo);
    }

    //results found
    if (opportunitySearch && opportunitySearch.length > 0) {
        nlapiLogExecution('AUDIT', 'check for duplicate function', 'results found');
        for (var i = 0; i < opportunitySearch.length; i++) {
            memoArray.push(opportunitySearch[i].getValue("memo"));
        }
        //results found but memo doesn't match - new opportunity
        if (memoArray.indexOf(memo) == -1) {
            nlapiLogExecution('AUDIT', 'check for duplicate function', 'results found, but its a not duplicate');
            createOpportunity(custID, title, memo);
        } else {
            nlapiLogExecution('AUDIT', 'check for duplicate function', 'results found, but its a duplicate');
        }
    }

}
/**	looks up the zip code on the contact record and returns a territory of that zip
 *
 * @param 	contactRecord		{nlobjRecord}	contact record
 * @return 	{string|boolean}					return string if we can find a territory to set.  return false if n/a
 */
function findTerritory(contactRecord) {
    nlapiLogExecution("Audit", "Create Opportunity", "Find Territory called");
    contactRecord.selectLineItem("addressbook", 1);
    var contactZip = contactRecord.getCurrentLineItemValue("addressbook", "zip") || "";

    //goes to scott when no zip is entered
    if (contactZip === "") {
        return false;
    }

    //sets territory to Canada if a Canadian Zip code is applied
    if (checkCanada(contactZip)) {
        return "14";
    }

    //truncates the last 4 digits of a 9 digit zip code
    if (contactZip.indexOf("-") > -1) {
        contactZip = contactZip.split("-")[0].trim();
    }

    // //if customer enters a zip code with only numbers, 9 digits but forgot the dash
    // if (contactZip.length == 9 && /^\d+$/.test(contactZip)) {
    //     contactZip = contactZip.substring("0", "5");
    // }


    //on the fly search
    var customrecord_geolocationSearch = nlapiSearchRecord("customrecord_geolocation", null, [
        ["custrecord_zip", "is", contactZip]
    ], [
        new nlobjSearchColumn("custrecord_zip", null, null), // 0
        new nlobjSearchColumn("custrecord_location", null, null), // 1
        new nlobjSearchColumn("custrecord_territory", null, null), // 2
        new nlobjSearchColumn("custrecord_tsm", null, null) // 3
    ]) || "";


    // if zip code is not in our database, it will default to scott's territory - "Other States"
    if (customrecord_geolocationSearch === null || customrecord_geolocationSearch === "") {
        nlapiLogExecution("Audit", "Create Opportunity", "First Territory Search returned nothing");
        /////////////////////////////////////////////////////////////////////////////////////////////////
        //tries one more time to find a working zip code - lobs off everything after the first 5 ///START
        /////////////////////////////////////////////////////////////////////////////////////////////////
        var customrecord_geolocationSearch2 = nlapiSearchRecord("customrecord_geolocation", null, [
            ["custrecord_zip", "is", contactZip.substring("0", "5")]
        ], [
            new nlobjSearchColumn("custrecord_zip", null, null), // 0
            new nlobjSearchColumn("custrecord_location", null, null), // 1
            new nlobjSearchColumn("custrecord_territory", null, null), // 2
            new nlobjSearchColumn("custrecord_tsm", null, null) // 3
        ]) || "";

        if (customrecord_geolocationSearch2 === null || customrecord_geolocationSearch2 === "") {
            nlapiLogExecution("Audit", "Create Opportunity", "Second Territory Search returned nothing");
            return "13"; //Other States Territory ID
        } else if (customrecord_geolocationSearch2) {
            nlapiLogExecution("Audit", "Create Opportunity", "Second Territory Search returned something");
            try {
                locationId = customrecord_geolocationSearch2[0].getValue(customrecord_geolocationSearch2[0].getAllColumns()[1]); // referencing array index 1 for location
                var territoryId = customrecord_geolocationSearch2[0].getValue(customrecord_geolocationSearch2[0].getAllColumns()[2]); // referencing array index 2 for territory
                salesrepId = customrecord_geolocationSearch2[0].getValue(customrecord_geolocationSearch2[0].getAllColumns()[3]); // referencing array index 3 for tsm
                if (salesrepId.split(",").length > 1) {
                    salesrepId = pickTSM(salesrepId.split(","));
                }
                return territoryId;
            } catch (error) {
                return false;
            }

        }
        ///////////////////////////////////////////////////////////////////////////////////////////////
        //tries one more time to find a working zip code - lobs off everything after the first 5 ///END
        ///////////////////////////////////////////////////////////////////////////////////////////////

    } else if (customrecord_geolocationSearch) {
        try {
            locationId = customrecord_geolocationSearch[0].getValue(customrecord_geolocationSearch[0].getAllColumns()[1]); // referencing array index 1 for location
            var territoryId = customrecord_geolocationSearch[0].getValue(customrecord_geolocationSearch[0].getAllColumns()[2]); // referencing array index 2 for territory
            salesrepId = customrecord_geolocationSearch[0].getValue(customrecord_geolocationSearch[0].getAllColumns()[3]); // referencing array index 3 for tsm
            if (salesrepId.split(",").length > 1) {
                salesrepId = pickTSM(salesrepId.split(","));
            }
            return territoryId;
        } catch (error) {
            return false;
        }

    }

}

function pickTSM(tsmList) {
    nlapiLogExecution("Audit", "Create Opportunity", "Picking TSM Function called");
    var filtersArray = [];
    var pickedTSM = "";

    for (var i = 0; i < tsmList.length; i++) {
        if (i < tsmList.length - 1) {
            filtersArray.push(["internalidnumber", "equalto", tsmList[i]]);
            filtersArray.push("OR");
        } else {
            filtersArray.push(["internalidnumber", "equalto", tsmList[i]]);
        }

    }

    var employeeSearch = nlapiSearchRecord("employee", null, filtersArray, [
        new nlobjSearchColumn("internalid"),
        new nlobjSearchColumn("custentity_last_lead_added_date").setSort(true)
    ]);

    for (var ix = 0; ix < employeeSearch.length; ix++) {
        pickedTSM = employeeSearch[ix].getValue(employeeSearch[0].getAllColumns()[0]);
        var lastLeadDate = employeeSearch[ix].getValue(employeeSearch[0].getAllColumns()[1]);
        if (!lastLeadDate) {
            break;
        }
    }

    return pickedTSM;
}

function updateEmployeeLeadDate(employeeId) {
    var formattedDate = nlapiDateToString(new Date(), 'datetimetz');
    nlapiSubmitField("employee", employeeId, 'custentity_last_lead_added_date', formattedDate);
}

/**	checks if the zip code is a valid canadian zip code
 * https://stackoverflow.com/questions/160550/zip-code-us-postal-code-validation
 *
 * @param zipCodeToTest		Zip Code to check against the RegEx
 * @return {boolean} 		True if the zip code is Canadian, False if not
 */
function checkCanada(zipCodeToTest) {
    var canada = new RegExp(/^[abceghjklmnprstvxy][0-9][abceghjklmnprstvwxyz]\s?[0-9][abceghjklmnprstvwxyz][0-9]$/i);
    return canada.test(zipCodeToTest);
}

/** prototype function not in use.  allows multi updating fields and passing of arrays mapped as field names
 *
 * @param field				{string|array}	field name as a string or an array of strings
 * @param recordToUpdate	{nlobjRecord}	customer record
 * @param recordToPullFrom	{nlobjRecord}	contact record
 */
function update(field, recordToUpdate, recordToPullFrom) {
    var fieldToUpdate;
    if (field instanceof Array) {
        while (field.length) {
            fieldToUpdate = recordToPullFrom.getFieldValue(field.shift());
            recordToUpdate.setFieldValue(fieldToUpdate);
        }
    } else {
        fieldToUpdate = recordToPullFrom.getFieldValue(field);
        recordToUpdate.setFieldValue(fieldToUpdate);
    }
}