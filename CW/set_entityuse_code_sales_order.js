//***********************************HELPER FUNCTIONS***********************************************
//This is the library for all sale order client scripts
//by Collin Wong


//***********************************ENTITY USE CODE START BY COLLIN WONG***********************************************
function apply_click_handlers_for_entity_use_code() {
    jQuery = jQuery ? jQuery : undefined;
    if (window && jQuery) {
        window.set_entityusecode = set_entityusecode;
        //logic
        var ways_to_change_address = ['#billingaddresslist_popup_new', '#billaddresslist_popup_link', '#shipaddresslist_popup_new', '#shipaddresslist_popup_link'];
        for (var i = 0; i < ways_to_change_address.length; i++) {
            jQuery(ways_to_change_address[i]).on('click', function(){
                window.flag_for_blank_address = false;
                customer_address_needs_update();
            });

        }
        jQuery('body').on('mousedown', 'div.dropdownDiv > div', function () {
            if (jQuery('div.dropdownDiv > div.dropdownSelected').text() == '- New -') {
                window.flag_for_blank_address = true;
                customer_address_needs_update();
            } 
        });
        jQuery('#custpage_ava_calculatetax').on('mousedown',set_avatax_field);
    }
}

function customer_address_needs_update(){
    var customer_id = nlapiGetFieldValue('entity');
    nlapiSubmitField('customer',customer_id,'custentity_need_entityusecode_update','T');
}

function get_tax_exempt_states() {
    var customer_id = nlapiGetFieldValue('entity');
    if (customer_id && customer_id !== '0') {
        var states = nlapiLookupField('customer', customer_id, 'custentity_tax_exempt_states').split(',');
        nlapiSetFieldValue('custbody_cust_exempt_states', states);
    }
}

function validate_tax_code(){
    if(nlapiGetCurrentLineItemValue('item','taxcode_display') !== 'AVATAX'){
        alert('TAX CODE MUST BE AVATAX');
        return false;
    }else{
        return true;
    }
}


/** loops through each address line of a customer and sets the entity/use code if the address is in a state
  * exempt state fot the customer
  * @param  none *
  * @return none *
  */
function set_entityusecode(webstore) {
    var states_map = get_states_map(); //use state map to get state abbreviations based on states internal ids
    var entity = nlapiGetFieldValue('entity');
    // nlapiLogExecution('DEBUG', 'entity is ' + typeof entity + ': ' + entity);
    if (entity && entity !== '0') {
        if (webstore) {
            //call suitelet
            try {
                var environment = nlapiGetContext().getEnvironment();
                var url;
                if (environment == 'SANDBOX') {
                    url = 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274_SB1&h=73d04c8e987670d4991c';
                } else {
                    url = 'https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=562&deploy=1&compid=4516274&h=60378349ea77b5405c25';
                }

                var data = {
                    payload: entity,
                    action: 'set_entityuse_code'
                };
                // nlapiLogExecution('DEBUG', JSON.stringify(data));
                nlapiRequestURL(url, data, null, null, 'POST');
            } catch (err) {
                nlapiLogExecution('ERROR', 'error at set_entityusecode webstore ', err);
            }
            //https://system.netsuite.com/app/help/helpcenter.nl?fid=section_N3059035.html#bridgehead_N3059142
        } else {
            var customer = nlapiLoadRecord('customer', entity);
            var USECODES = create_usecodes_map();
            // nlapiLogExecution('DEBUG', nlapiGetFieldValue('entity'));
            var tax_exempt_states;
            var length_of_address_list = customer.getLineItemCount('addressbook'); //find length of address book so we can sort through it
            try {
                tax_exempt_states = customer.getFieldValues('custentity_tax_exempt_states'); //grab array of internal ids where the customer is tax exempt
            } catch (e) {
                nlapiLogExecution('ERROR', 'faied to get tax exempt states, error:' + e);
            }
            if (tax_exempt_states) {
                for (var i = 1; i <= length_of_address_list; i++) { //loop through each address line
                    customer.selectLineItem('addressbook', i);
                    var state = customer.getCurrentLineItemValue('addressbook', 'state'); //grab state on the line
                    if (states_map[state]) {
                        var state_id = states_map[state].toString(); //need to compare to string for comparison
                        // nlapiLogExecution('DEBUG', 'state: ' + state + ' | state_id: ' + state_id);

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
                    // nlapiLogExecution('DEBUG', 'submitted record ', done);
                } catch (err) {
                    nlapiLogExecution('ERROR', 'failed to submit record', err);
                }
            }
            window.entityusecode_needs_to_be_set = false; //this is a global used to tell if this function should be called. Set to true on click of adding or editing an address
        } //webstore
    } //entity
}


/** returns an object that is a map for entity use codes and their internal ids.
    * @param  none *
    * @return usecodes_map {object} *
    */

function create_usecodes_map() {
    return {
        Z: '2',
        G: '3',
        TAXABLE: '1'
    };
}

/** returns an object that is a map for state abbreviations and their internal ids in netsuite
    * @param  none *
    * @return state_map {object} *
    */
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

function set_avatax_field() {
    var states_map = get_states_map();
    var tax_exempt_states = nlapiGetFieldValues('custbody_cust_exempt_states');
    // nlapiLogExecution('DEBUG', 'field change -> tax_exempt_states:', tax_exempt_states);
    var ship_address = nlapiGetFieldValue('shipaddress');
    // nlapiLogExecution('DEBUG', 'field change -> ship_address:', ship_address);
    if (tax_exempt_states && ship_address) {
        var state = ship_address.match(/(?:(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]))/gm);
        // nlapiLogExecution('DEBUG', 'field change -> states match:', state);
        if (state) {
            var shipstate = state[state.length - 1];
            // nlapiLogExecution('DEBUG', 'field change -> actual state:', shipstate);
            if (states_map[shipstate]) {
                var state_id = states_map[shipstate].toString();
                if (tax_exempt_states.indexOf(state_id) !== -1) {
                    nlapiSetFieldValue('custbody_ava_shiptousecode', 3);
                    // nlapiLogExecution('DEBUG', 'field change', 'exempt');
                } else {
                    nlapiSetFieldValue('custbody_ava_shiptousecode', 1);
                    // nlapiLogExecution('DEBUG', 'field change', 'taxable');
                }
            }//states_map[shipstate]
        }//state
    }//tax_exempt_states
}

//***********************************ENTITY USE CODE END***********************************************

//***********************************CELERITAS START***********************************************
function getinfo_Celeritas(){
    var Celeritas = {
        SUBSIDIARY: '3',
        LOCATION: '28',
        PO_TYPE: 'DropShip'
    };
    return Celeritas;
}

//sets cart items to be Drop Shipped, if location is Celeritas
function set_PO_type_to_dropship(){
    var Celeritas = getinfo_Celeritas();

    var itemLocation = nlapiGetCurrentLineItemValue('item', 'location');
    if (itemLocation === Celeritas.LOCATION) {
        nlapiSetCurrentLineItemValue('item', 'createpo', Celeritas.PO_TYPE);
    }
}

//sets Celeritas as the default location, if the subsidiary is Celeritas
function set_location_to_celeritas(){
    var Celeritas = getinfo_Celeritas();

    var subsidiary = nlapiGetFieldValue('subsidiary');
    if (subsidiary === Celeritas.SUBSIDIARY) {
        nlapiSetFieldValue('location', Celeritas.LOCATION);
    } //Celeritas  https://system.na2.netsuite.com/app/common/otherlists/locationtype.nl?id=28
}

//***********************************CELERITAS END***********************************************



//***********************************APPLY SHIPPING ALGORITHM***********************************************

function hide_optimize_location_button(){
    var role = nlapiGetRole();
    var ALLOWED_ROLES = [
        '3',//admins
        '1025'//
    ];
    if(ALLOWED_ROLES.indexOf(role) == -1){//hides Optimize Ship Locations Button
        jQuery('#tbl_custformbutton3').hide();
    }
}

//***********************************APPLY SHIPPING ALGORITHM END***********************************************

//***********************************Client Manual Credit Hold***********************************************

function client_manual_credit_hold() {
    var manualCreditHold = nlapiGetFieldValue('manualcredithold');
    if (manualCreditHold == "T") {
        alert("Customer has a manual credit hold.");
        return false;
    }
    return true;
}
//***********************************Client Manual Credit Hold End***********************************************