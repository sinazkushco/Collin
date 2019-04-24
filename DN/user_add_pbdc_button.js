/** entry point fires when the read operation on a record occurs including nlapiLoadRecord, but before returning the record or page.
 * it cannot source standard records -- use pageInit for that.
 *  @param  type    string          read operation type: {create edit view copy print email quickview}
 *  @param  form    nlobjForm       object representing the current form
 *  @param  request nlobjRequest    object representing the GET request (browser only)
 */
function beforeLoad_pb_button(type, form, request){
    
    if(type == "create" || type == "edit" || type == "copy") {
        form.setScript('customscript_client_pb_test');  
        form.addButton('custpage_calc_pb_dc','Calculate Bundle Discount','calc_discount();');
    }
      if (type == 'view') {
        var script = "window.open(nlapiResolveURL(\'SUITELET\', \'customscript_suitelet_pro_forma_invoice\', \'customdeploy_suitelet_pro_forma_invoice\') + \'&so_id=\' + nlapiGetRecordId());";
        form.addButton('custpage_printitemlabel','Print Pro Forma Invoice', script);
    }


}

