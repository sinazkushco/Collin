
////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// global variables /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

var Celeritas = {
    SUBSIDIARY: '3'
    , LOCATION: '28'
};
var PO_type = 'DropShip'; //what to default Celeritas Purchase Orders to

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// entry points /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

function postSourcing_celeritas(type, name){
    if (type == 'item' && name == 'location') {
        set_PO_type();
    }
    else if (type == null && name == 'subsidiary'){
        set_subsidiary_to_celeritas();
    }
}

//this fights with BSP Sales Order on Load.  And wins.  TBH the post sourcing should handle it.
function pageInit_celeritas(type){
    set_subsidiary_to_celeritas();
}

////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////// helper functions /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

//sets cart items to be Drop Shipped, if location is Celeritas
function set_PO_type(){
    var itemLocation = nlapiGetCurrentLineItemValue('item', 'location');
    if (itemLocation === Celeritas.LOCATION) {
        nlapiSetCurrentLineItemValue('item', 'createpo', PO_type);
    }
}

//sets Celeritas as the default location, if the subsidiary is Celeritas
function set_subsidiary_to_celeritas (){
    var subsidiary = nlapiGetFieldValue('subsidiary');
    if (subsidiary === Celeritas.SUBSIDIARY) {
        nlapiSetFieldValue('location', Celeritas.LOCATION);
    } //Celeritas  https://system.na2.netsuite.com/app/common/otherlists/locationtype.nl?id=28
}
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////unused entry points/////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////


/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function saveRecord_celeritas(){

    return true;
}

/** fires before a field is about to be changed by the user or client calls, including beforeLoad events
 * DOES NOT APPLY TO DROPDOWN SELECT OR CHECKBOX FIELDS
 * essentially, js.onBlur
 * @param type      string          the sublist internal ID (optional)
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * @return  boolean     false to prevent submission
 * */
function validateField_celeritas(type, name, linenum){

    return true;
}

/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID (optional)
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function fieldChanged_celeritas(type, name, linenum){

}

/** fires when an existing line is selected
 * essentially, pageInit for sublist line items
 * @param type      string          the sublist internal ID
 */
function lineInit_celeritas(type){

}

/** fires before a line is being added to a sublist
 * essentially, saveRecord for sublist line items
 * @param   type        string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function validateLine_celeritas(type){

    return true;
}

/** fires after a sublist change, but only if it causes the total to change
 * should not be used for manipulating the current line item value. getCurrentLineItem does not work
 * @param type      string          the sublist internal ID
 */
function recalc_celeritas(type){

}

/** fires when you insert a line into an edit sublist
 * @param type      string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function validateInsert_celeritas(type){

    return true;
}

/** fires when you try to remove an existing line item from an edit sublist
 * @param type      string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function validateDelete_celeritas(type){

    return true;
}