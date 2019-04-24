var context = nlapiGetContext();
var exec = context.getExecutionContext();
var role = context.getRole();

/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function master_item_page_init(type) {

}

/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function master_item_save_record() {
    var verified = true;
    verified = confirm_vape_filling_instructions(exec);
    return verified;
}


/** fires before a field is about to be changed by the user or client calls, including beforeLoad events
 * DOES NOT APPLY TO DROPDOWN SELECT OR CHECKBOX FIELDS
 * essentially, js.onBlur
 * @param type      string          the sublist internal ID (optional)
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * @return  boolean     false to prevent submission
 * */
function master_item_validate_field(type, name, linenum) {

    return true;
}

/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID (optional)
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function master_item_field_changes(type, name, linenum) {

}

/** fires after a field has changed and all child (dependent) field values are sourced from the server
 * essentially, fieldChanged but after dependent values have been set
 * @param type      string          the sublist internal ID (optional)
 * @param name      string          the field internal ID
 * */
function master_item_post_sourcing(type, name) {

}

/** fires when an existing line is selected
 * essentially, pageInit for sublist line items
 * @param type      string          the sublist internal ID
 */
function master_item_line_init(type) {

}

/** fires before a line is being added to a sublist
 * essentially, saveRecord for sublist line items
 * @param   type        string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function master_item_validate_line(type) {

    return true;
}

/** fires when you insert a line into an edit sublist
 * @param type      string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function master_item_validate_insert(type) {

    return true;
}

/** fires when you try to remove an existing line item from an edit sublist
 * @param type      string          the sublist internal ID
 * @return  boolean     false to prevent submission
 * */
function master_item_validate_delete(type) {

    return true;
}

/** fires after a sublist change, but only if it causes the total to change
 * should not be used for manipulating the current line item value. getCurrentLineItem does not work
 * @param type      string          the sublist internal ID
 */
function master_item_recalculate(type) {

}