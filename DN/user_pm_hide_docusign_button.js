

/** entry point fires when the read operation on a record occurs including nlapiLoadRecord, but before returning the record or page.
 * it cannot source standard records -- use pageInit for that.
 *  @param  type    string          read operation type: {create edit view copy print email quickview}
 *  @param  form    nlobjForm       object representing the current form
 *  @param  request nlobjRequest    object representing the GET request (browser only)
 */
function beforeLoad_hideDocuSignButton(type, form, request){
    // if(type == "view"){
        form.removeButton({
          id :'custpage_button_docusign_send',
         });
         form.removeButton({
            id :'custpage_button_docusign_sign',
           });
    // }
}
