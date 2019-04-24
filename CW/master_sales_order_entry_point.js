//Master Client Script Entry Point Files For Sales Orders
//Collin Wong

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// global variables /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
var context = nlapiGetContext();
var exec = context.getExecutionContext();
var role = context.getRole();
var user_id = context.getUser();

// page level variables
var promotions_in_use = false;
var recurse_promotions = false;
var surcharge = false;  // do we want to add a surcharge item?
var no_recurse = false;  // do not recurse when we add a line in script
var CONST_SURCHARGE_ITEM = '15806';  // constant defines my item SKU internal id for Surcharge item
var masterLineCount; 
var CONST_SURCHARGE_ITEM_SCA = '15959'

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// global objects /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var disable_sublist_fields_obj = new Disable_sublist_fields(exec);

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// entry points /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function page_init_master(type) {
    //****************PAGEINIT USERINTERFACE********************
    apply_click_handlers_for_entity_use_code(exec); //tax exemption 
    get_tax_exempt_states(exec); //tax exemption
    moveDiscountButton(exec); //pb discount
    disable_cc_on_file_page_init(exec); //cc on file disable
    hide_optimize_location_button(exec);
    //****************PAGEINIT WEBSTORE********************
    set_entityusecode(exec);//update address of customer on load of sales order
    //****************PAGEINIT ALL CONTEXT********************
    set_location_to_celeritas();//this fights with BSP Sales Order on Load.  And wins.  really only applies on create/copy from an entity.  all other cases covered by fieldchanged
    sort_locations();
    filterPaymentMethods();
    changeDiscountText()
    setFieldDisabled_onPageInit();
    hideEstimateTaxButton_pageInit();
    //   doNotProcessTestOrder(type, context, exec, role)
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

        if (fldname === 'shipaddress') {
            try {
                set_avatax_field(exec);
            } catch (err) {
                nlapiLogExecution('ERROR', 'error userinterface set_entityusecode_on_new_ship_address role' + role, err);
            }
        }
        if (fldname === 'entity'){
            try {
                // applyPromotion()
            } catch (err) {
                nlapiLogExecution('ERROR', 'error userinterface applyPromotion', err)
            }
        
        }
        if(fldname == 'terms'){
            try {
                // updateChargeOnTermsChange();
            } catch (err) {
                nlapiLogExecution('ERROR', 'error userinterface applyPromotion', err)
            }
        }
        disable_cc_on_file_field_change(exec, fldname);
    }
    if(exec == 'webstore'){
        //nlapiLogExecution('ERROR','FIELD NAME', fldname);
        if(fldname == 'couponcode'){
            var coupon = nlapiGetFieldValue('couponcode');
            nlapiLogExecution('ERROR','coupon', coupon);
            if(coupon == ''){
                nlapiLogExecution('ERROR','SETTING BUNDLE DISCOUNT', 'PLEASE');
                saveRecord_pbDiscount(exec);
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
        if (type == 'item') {
            if (fldname == 'location') {
                set_PO_type_to_dropship();
            }
        }
        if (fldname === 'entity') {
            get_tax_exempt_states(exec); //when customer is chosen on sales order, get their tax exempt states and set avatax field
            set_avatax_field(exec);
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
    if(type == 'item'){
        //disable_line_fields(exec);
        disable_sublist_fields_obj.disable_fields_for_item_sublist();
    }
}

/** fires when an existing line is removed
 * essentially, returning false blocks user action
 * @param type      string          the sublist internal ID
 */
function validate_delete_master(type){
    var valid = true
    if(exec == 'userinterface'){
        if(type == 'item'){
            valid = validate_delete(type);
        }
    }
    return valid
}

/** The validateInsert event occurs when 
 * you insert a line into an edit sublist
 * @param type      string          the sublist internal ID
 */
function validate_insert_master(type) {
    var valid = true;
    if(exec == 'userinterface'){
        valid = stop_insert_between_ct_items(type) // CHANGE
    }
    return valid;
}


/** fires before a line is being added to a sublist
 * essentially, saveRecord for sublist line items
 * @param   type        string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function validate_line_master(type) {

    var valid = true;
    //****************VALIDATE LINE USERINTERFACE********************
    if (exec === 'userinterface') {
        if (type == 'item') {
            validateline(type)
            valid = validate_tax_code();//make tax code on line item always avatax
        }
    }
    return valid;
}


function on_save_master() {
    var validating_functions = [
        // removeWebstoreTariff_onSave,
        recalcTariffs_onSave,// CHANGE
        prevent_save_multiple_email_with_cc,
        client_manual_credit_hold,
        saveRecord_verifyAuthAmount,
        check_for_natural_products,
        saveRecord_ccHasEmail,
    ];
    if (exec === 'userinterface') {
        for(var func in validating_functions){
            if(!validating_functions[func](exec)){
                return false;
            }
        }
    }

    if (exec === 'webstore') {
       try{
        var total = Number(nlapiGetFieldValue('subtotal'));
        	if(total < 350){
            	return false;
        	}
    	}catch(e){
       		 nlapiLogExecution('ERROR','CHECK FOR 350 subtotal', e);
    	}
        set_ship_locations(exec, context);
    }

    //saveRecord_pbDiscount(exec);
    return true;
}

function recalc_master(type, action) {
    if (exec !== 'webstore'){
        // recalcTariffs();
        recalc(type) //CHANGE
    }
    // if (exec === 'webstore') {
    //      if (type === 'item' && action === 'commit') {
    //         saveRecord_pbDiscount(exec);
    //         nlapiLogExecution('AUDIT','action five',action);
    //         nlapiLogExecution('AUDIT','item count recalc', nlapiGetLineItemCount('item'));
    //     }
    // }
}
