/** loops through address lines and sets entity use code based on the customers tax exempt states
 * @param  none *
 * @return none *
 */

function set_entityusecode(request) {
    var response = {
        success: false,
        status: ''
    };
    //get param of payload
    nlapiLogExecution('DEBUG', 'request stringify ', JSON.stringify(request));
    if (request.access) {
        var customer_id = request.payload;
        var customer = '';
        if (customer_id) {
            var tax_exempt_states;
            var states_map = get_states_map(); //use state map to get state abbreviations based on states internal ids
            try {
                customer = nlapiLoadRecord('customer', customer_id);
            } catch (e) {
                nlapiLogExecution('error', 'failed to load customer in entityuse code restlet' + e);
            }
            if (customer) {
                try {
                    var USECODES = create_usecodes_map();
                    var length_of_address_list = customer.getLineItemCount('addressbook'); //find length of address book so we can sort through it
                    tax_exempt_states = customer.getFieldValues('custentity_tax_exempt_states'); //grab array of internal ids where the customer is tax exempt
                } catch (e) {   
                    nlapiLogExecution('ERROR', 'NETSUITE ERROR CANNOT ACCESS ADDY BOOK FOR SOME REASON' + e);
                }
                if (tax_exempt_states) {
                    for (var i = 1; i <= length_of_address_list; i++) { //loop through each address line
                        customer.selectLineItem('addressbook', i);
                        var state = customer.getCurrentLineItemValue('addressbook', 'state'); //grab state on the line
                        if (states_map[state]) {
                            var state_id = states_map[state].toString(); //need to compare to string for comparison
                            if (tax_exempt_states.indexOf(state_id) !== -1) { //if state on address is in tax exempt states
                                customer.setCurrentLineItemValue('addressbook', 'custpage_ava_entityusecode', USECODES.G); //set entity use code to 2
                            } else {
                                customer.setCurrentLineItemValue('addressbook', 'custpage_ava_entityusecode', USECODES.TAXABLE); // else set it to 1
                            }
                            customer.commitLineItem('addressbook');
                        }
                    }
                    try {
                        var done = nlapiSubmitRecord(customer, true); //save changes
                        nlapiLogExecution('DEBUG', 'done', done);
                        response.status = 'entityusecodes updated';
                    } catch (e) {
                        nlapiLogExecution('ERROR', 'failed to save', e);
                    }
                } else {
                    response.status = 'customer' + customer_id + 'has no tax exempt states';
                }
                response.success = true;
            }
        } else {
            response.status = 'Missing Customer ID';
        }
    }
    return response;
}



function create_usecodes_map() {
    return {
        Z: '2',
        G: '3',
        TAXABLE: '1'
    };
}

function get_states_map() {
    return {
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
}