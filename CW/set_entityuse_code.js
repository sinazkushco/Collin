//Master Client Script Entry Point Files For Sales Orders
//Collin Wong

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// global variables /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
var context = nlapiGetContext();
var exec = context.getExecutionContext();
var role = context.getRole();


////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// entry points /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function page_init_master(type) {

    //****************PAGEINIT USERINTERFACE********************
    if (nlapiGetContext().getExecutionContext() === 'userinterface') {
        if (window && window.testScript) {
            nlapiLogExecution('DEBUG', 'USERINTERFACE page init', 'calling 3 functions');
            apply_click_handlers_for_entity_use_code();
            hide_optimize_location_button();
        }
    }
    //****************PAGEINIT WEBSTORE********************
    if (nlapiGetContext().getExecutionContext() === 'webstore') {
        try {
            nlapiLogExecution('DEBUG', 'WEBSTORE page init: calling set entityusecode');
            set_entityusecode('webstore');//update address of customer on load of sales order
        } catch (err) {
            nlapiLogExecution('DEBUG', 'WEBSTORE page init: calling set entityusecode error', err);
        }
    }

    //****************PAGEINIT ALL CONTEXT********************
    set_location_to_celeritas();//this fights with BSP Sales Order on Load.  And wins.  really only applies on create/copy from an entity.  all other cases covered by fieldchanged

}

/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID (optional)
 * @param fldname   string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function field_change_master(type, fldname, linenum) {

    //****************FIELD CHANGE USERINTERFACE********************
    if (exec === 'userinterface') {
        if (window && window.testScript) {
            if (fldname === 'shipaddress') {
                if (!window.flag_for_blank_address) {
                    try {
                        set_avatax_field();
                        nlapiLogExecution('DEBUG', 'field change', 'set avatax field');
                    } catch (err) {
                        nlapiLogExecution('ERROR', 'error userinterface set_entityusecode_on_new_ship_address', err);
                    }
                    return true;
                } else {
                    window.flag_for_blank_address = false;
                }
            }
        }
    }
    //****************FIELD CHANGE ALL CONTEXT********************
    if (type == null && fldname == 'subsidiary') {
        set_location_to_celeritas();
    }

}

/** fires after a field has changed and all child (dependent) field values are sourced from the server
 * essentially, fieldChanged but after dependent values have been set
 * @param type      string          the sublist internal ID (optional)
 * @param fldname   string          the field internal ID
 * */
function post_sourcing_master(type, fldname) {

    //****************POSTSOURCING USERINTERFACE********************
    if (exec === 'userinterface') {
        if (window && window.testScript) {
            if (type == 'item') {
                if (fldname == 'location') {
                    set_PO_type_to_dropship();
                }
            }
            if (fldname === 'entity') {
                get_tax_exempt_states();
            }
        }
    }
    //****************POSTSOURCING ALL CONTEXT********************
}

/** fires when an existing line is selected
 * essentially, pageInit for sublist line items
 * @param type      string          the sublist internal ID
 */
function line_init_master(type) {

    //****************LINEINIT USERINTERFACE********************
    if (exec === 'userinterface') {
        if (window && window.testScript) {
            if (type == 'item') {
                //disable_tax_code_on_item_line();//disable tax code field on line item
            }
        }
    }
}


/** fires before a line is being added to a sublist
 * essentially, saveRecord for sublist line items
 * @param   type        string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function validate_line_master(type) {

    //****************VALIDATE LINE USERINTERFACE********************
    if (exec === 'userinterface') {
        if (window && window.testScript) {
            if (type == 'item') {
                return validate_tax_code();//make tax code on line item always avatax
            }
        }
    }
    return true;
}


function on_save_master() {
    if (exec === 'userinterface') {
        if (window && window.testScript) {
            return client_manual_credit_hold();
        }
    }
    return true;
}