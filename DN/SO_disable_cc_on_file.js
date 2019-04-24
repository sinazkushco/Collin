/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function disable_cc_on_file_page_init(exec){
    if(exec == "userinterface"){
        var payment_on_delivery_checked = nlapiGetFieldValue("custbody_payment_on_delivery") == "T" ? true : false;
        if(payment_on_delivery_checked){
            nlapiGetField("creditcard").setDisplayType("disabled");
        }
    }
}

/** fires when a field is changed by the user or client calls, including beforeLoad events
 * essentially, js.onChange
 * @param type      string          the sublist internal ID (optional)
 * @param name      string          the field internal ID
 * @param linenum   {string|null}   if sublist: line number starting at index 1, not 0.  if body field, pass in null
 * */
function disable_cc_on_file_field_change(exec, fldname){
    if(exec == "userinterface"){
        if(fldname == "custbody_payment_on_delivery"){
            var payment_on_delivery_checked = nlapiGetFieldValue("custbody_payment_on_delivery") == "T" ? true : false;
            if(payment_on_delivery_checked){
                nlapiGetField("creditcard").setDisplayType("disabled");
            } else {
                nlapiGetField("creditcard").setDisplayType("normal");
            }
        }
    }
}