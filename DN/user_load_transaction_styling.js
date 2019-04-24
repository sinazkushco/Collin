/** entry point fires when the read operation on a record occurs including nlapiLoadRecord, but before returning the record or page.
 * it cannot source standard records -- use pageInit for that.
 *  @param  type    string          read operation type: {create edit view copy print email quickview}
 *  @param  form    nlobjForm       object representing the current form
 *  @param  request nlobjRequest    object representing the GET request (browser only)
 */
function beforeLoad_loadTransactionStyling(type, form, request) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface' && type == "view") {
        form.setScript('customscript_client_trans_rec_styling');//<< SET THIS TO YOUR SCRIPT ID
    }
}