function set_entityuse_code_after_submit_runs(type) {
    var states_map = get_states_map();
    var customer = nlapiLoadRecord('customer', nlapiGetRecordId());
    nlapiLogExecution('DEBUG',nlapiGetRecordId());
    var length_of_address_list = customer.getLineItemCount('addressbook');
    var tax_exempt_states = customer.getFieldValues('custentity_tax_exempt_states');
    for (var i = 1; i <= length_of_address_list; i++) {
        customer.selectLineItem('addressbook', i);
        var state = customer.getCurrentLineItemValue('addressbook', 'state');
        nlapiLogExecution('DEBUG','state',state);
        var state_id = states_map[state].toString();
        if (tax_exempt_states.indexOf(state_id) !== -1) {
            nlapiLogExecution('DEBUG','i made it');
            customer.setCurrentLineItemValue('addressbook', 'custpage_ava_entityusecode', '2');
            // customer.setLineItemValue('addressbook', 'custpage_ava_entityusecode', i , '2');
            customer.commitLineItem('addressbook');
        }
    }
  
    nlapiLogExecution('DEBUG','beforesubmit');
    var done = nlapiSubmitRecord(customer,true);
    nlapiLogExecution('DEBUG','done', done);
    function get_states_map(){
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
}




