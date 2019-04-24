//disable entity/use code field based on roles
//on save record, if the edit button was hit on address line, set entityuse codes

/** called in paginit to set the window method to the set_entityusecode function
 * applies click handlers to certain inputs to trigger the window.entityusecode_needs_to_be_set
 * which is a flag to see if we need to call set_entityusecode
 * @param  none *
 * @return none *
 */
function disable_entityusecode_for_roles() {
    if (nlapiGetContext().getExecutionContext() === 'userinterface') {
        var ALLOWEDROLES = [
            '3', //Administrator
            '1010', //Accountant
            '1048', //Senior Accountant
            '1012' //CFO/Controller
        ];
        nlapiDisableLineItemField('addressbook', "custpage_ava_entityusecode", true); //disable entityusecodes field
        if (ALLOWEDROLES.indexOf(nlapiGetRole()) === -1) { //only allow certain roles access to tax exempt states
            nlapiDisableField('custentity_tax_exempt_states', true);
        }

        if (NLShowAddressChildRecordPopup !== undefined) {
            var temp_function = NLShowAddressChildRecordPopup;//we need to hijack netsuites function to set a global 
            var entityusecode_on_address_popup = function(containingRecordManagerName, targetRecordManagerName, bReadOnly, url, triggerObject, linenum, options, machineName, subrecordName) {
                window.entityusecode_needs_to_be_set = true;
                temp_function(containingRecordManagerName, targetRecordManagerName, bReadOnly, url, triggerObject, linenum, options, machineName, subrecordName);
            };
            NLShowAddressChildRecordPopup = entityusecode_on_address_popup;
        } else {
            //some way we can notify the dev team that this errored
        }
    }
}

/** on save see if entityusecode_needs_to_be_set then edit the codes per address
 * @param  none *
 * @return none *
 */

function set_entityusecode_if_edit_address() {
    if (nlapiGetContext().getExecutionContext() === 'userinterface') {
        if (window.entityusecode_needs_to_be_set) {
            set_entityusecode();
        }
        return true;
    }
}


/** loops through address lines and sets entity use code based on the customers tax exempt states
 * @param  none *
 * @return none *
 */

function set_entityusecode() {
    var STATES = get_states_map(); //use state map to get state abbreviations based on states internal ids
    var USECODES = create_usecodes_map();
    var length_of_address_list = nlapiGetLineItemCount('addressbook'); //find length of address book so we can sort through it
    var tax_exempt_states = nlapiGetFieldValues('custentity_tax_exempt_states'); //grab array of internal ids where the customer is tax exempt
    if (tax_exempt_states) {
        for (var i = 1; i <= length_of_address_list; i++) { //loop through each address line
            nlapiSelectLineItem('addressbook', i);
            var state = nlapiGetCurrentLineItemValue('addressbook', 'state'); //grab state on the line
            nlapiLogExecution('DEBUG', 'state', state);
            if(STATES[state]){
                var state_id = STATES[state].toString(); //need to compare to string for comparison
                if (tax_exempt_states.indexOf(state_id) !== -1) { //if state on address is in tax exempt states
                    nlapiSetCurrentLineItemValue('addressbook', 'custpage_ava_entityusecode', USECODES.G); //set entity use code to 2
                } else {
                    nlapiSetCurrentLineItemValue('addressbook', 'custpage_ava_entityusecode', USECODES.TAXABLE); // else set it to 1
                }
                nlapiCommitLineItem('addressbook');
            }
        }
    }
    window.entityusecode_needs_to_be_set = false; //this is a global used to tell if this function should be called. Set to true on click of adding or editing an address

    function create_usecodes_map() {
        return {
            Z: '2'
            , G: '3'
            , TAXABLE: '1'
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
}

function after_tax_exempt_states_change(type, name) {
    if (nlapiGetContext().getExecutionContext() === 'userinterface') {
        if (name === 'custentity_tax_exempt_states') {
            window.entityusecode_needs_to_be_set = true;
        }
    }
}