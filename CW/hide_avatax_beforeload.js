//hides Avatax tab
//by Collin Wong 6/12/18
function hide_avatax_tab(type, form) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface') {
        form.setScript('customscript_hide_avatax_tab_client');
    }
}