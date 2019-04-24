function hide_avatax_tab() {
    nlapiLogExecution('DEBUG', 'hiding avatax');
    if (nlapiGetContext().getExecutionContext() === 'userinterface') {
        jQuery('head').append('<style type="text/css" id="hide_avatax_tab_js">#custpage_avatablnk,#custpage_avatab_wrapper,#custpage_avatab_pane_hd {display:none;}</style>');
    }
}
hide_avatax_tab();