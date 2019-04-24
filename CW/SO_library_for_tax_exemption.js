//***********************************HELPER FUNCTIONS***********************************************
//This is the library for all sale order client scripts
//by Collin Wong

var entityusecode_running = false;
//***********************************ENTITY USE CODE START BY COLLIN WONG***********************************************
function apply_click_handlers_for_entity_use_code(exec) {
    // jQuery = jQuery ? jQuery : undefined;
    if (exec === 'userinterface') {
        if (window && jQuery) {
            var ways_to_change_address = ['#billingaddresslist_popup_new', '#billaddresslist_popup_link', '#shipaddresslist_popup_new', '#shipaddresslist_popup_link'];
            for (var i = 0; i < ways_to_change_address.length; i++) {
                jQuery(ways_to_change_address[i]).on('click', function () {
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
            jQuery('#custpage_ava_calculatetax').on('mousedown', set_avatax_field);
        }
    }
}

function customer_address_needs_update() {
    var customer_id = nlapiGetFieldValue('entity');
    nlapiSubmitField('customer', customer_id, 'custentity_need_entityusecode_update', 'T');
}

function get_tax_exempt_states(exec) {
    if (exec === 'userinterface') {
        var customer_id = nlapiGetFieldValue('entity');
        if (customer_id && customer_id !== '0') {
            var states;
            try {
                states = nlapiLookupField('customer', customer_id, 'custentity_tax_exempt_states').split(',');
            } catch (e) {
                nlapiLogExecution('AUDIT', 'ERROR look up tax exempt states | role' + nlapiGetContext().getRoleId(), JSON.stringify(e));
            }
            if (states) {
                try {
                    nlapiSetFieldValue('custbody_cust_exempt_states', states);
                } catch (e) {
                    nlapiLogExecution('AUDIT', 'Setting Tax Exempt States ERROR', JSON.stringify(e));
                }

            }
        }
    }
}

function validate_tax_code(exec) {
    if(exec === 'userinterface'){
        if (nlapiGetCurrentLineItemValue('item', 'taxcode_display') !== 'AVATAX') {
            alert('TAX CODE MUST BE AVATAX');
            return false;
        }
    }
    return true;
}

function set_avatax_field(exec) {
    if(exec === 'userinterface'){
        if (!window.flag_for_blank_address) {
            var states_map = get_states_map();
            var tax_exempt_states = nlapiGetFieldValues('custbody_cust_exempt_states');
            var ship_address = nlapiGetFieldValue('shipaddress');
            if (tax_exempt_states && ship_address) {
                var state = ship_address.match(/(?:(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]))/gm);
                if (state) {
                    var shipstate = state[state.length - 1];
                    if (states_map[shipstate]) {
                        var state_id = states_map[shipstate].toString();
                        if (tax_exempt_states.indexOf(state_id) !== -1) {
                            nlapiSetFieldValue('custbody_ava_shiptousecode', 3);
                        } else {
                            nlapiSetFieldValue('custbody_ava_shiptousecode', 1);
                        }
                    }//states_map[shipstate]
                }//state
            }//tax_exempt_states
        }else{
            window.flag_for_blank_address = false;
        }
    }
}

/** loops through each address line of a customer and sets the entity/use code if the address is in a state
  * exempt state fot the customer
  * @param  none *
  * @return none *
  */
function set_entityusecode(webstore) {
    if(!entityusecode_running){
        entityusecode_running = true;
        var states_map = get_states_map(); //use state map to get state abbreviations based on states internal ids
        var entity = nlapiGetFieldValue('entity');
        //nlapiLogExecution('DEBUG', 'entity is ' + typeof entity + ': ' + entity);
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
                    //nlapiLogExecution('DEBUG', JSON.stringify(data));
                    nlapiRequestURL(url, data, null, null, 'POST');
                } catch (err) {
                    nlapiLogExecution('ERROR', 'error at set_entityusecode webstore ', JSON.stringify(err));
                }
                //https://system.netsuite.com/app/help/helpcenter.nl?fid=section_N3059035.html#bridgehead_N3059142
            }
        }
        entityusecode_running = false;
    }
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

//***********************************ENTITY USE CODE END***********************************************

