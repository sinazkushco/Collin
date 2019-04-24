/**
 * The purpose of this script is to ...
 *
 *  This script can be deployed on ....
 *  The model is... {memorizeTransaction}
 * */

// cut and paste entry points into here.

/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function pageInit_memorizeTransaction(type){
    var context = nlapiGetContext();
    var exec = context.getExecutionContext();
    if (exec === 'userinterface'){
        set_do_memorized_function(type);
    }

    function set_do_memorized_function(type){
        if (window.do_memorize && window.create_memorized_transaction){
            window.do_memorize = do_memorized(type);
        } else {
            window.do_memorize = do_memorized('refactor');
        }
    }
    function do_memorized(type) {
        var $forecastButtons = jQuery("input[value~='Forecast']");
        if (type === 'edit' || type === 'copy'){
            if (nlapiGetFieldValue('memdoc')) { //document.forms['main_form'].elements['memdoc']
                $forecastButtons.val('Update Forecast'); //document.forms['main_form'].elements['memorize'].value = 'Update Forecast';
                return function type_is_edit(){
                    NS.form.setChanged(true);
                    return create_memorized_transaction(false);
                }
            } else {
                $forecastButtons.parent().parent().parent().parent().detach(); //removes both buttons from the view
                return function this_should_never_be_called_by_a_script(){
                    alert("This order doesn't have a Forecast.  If you want to create a Forecast, do so from a new blank Sales Order.");
                };
            }
        } else if (type === 'create'){
            $forecastButtons.val('Create Forecast');
            return function type_is_create(){
                NS.form.setChanged(true);
                return create_memorized_transaction(true);
            }
        } else {
            return function netsuite_references_broken(){
                console.error('=> callback -> You need to refactor the code, as something is broken?');
                alert('Forecast functionality has been changed by NetSuite; please let donald.tran@kushbottles.com know so he can fix it for you');
                //if this happens, netsuite did a UI overhaul and the references to the HTML structure is broken.  you need to point it to the correct DOM element again.
                //  also praying for you that the memorize feature is even still there.  if not, RIP forecasting
                return false;
            };
        }
    }
}


// This is NetSuite's do_memorize function that we are redefining.
// function do_memorize() {
//   NS.form.setChanged(true);
//   var prompt = 'You have already memorized this transaction.\n\nClick OK to create another memorized transaction.\n\nClick Cancel to update this memorized transaction.';
//   if (document.forms['main_form'].elements['memdoc'] && !confirm(prompt))
//       return create_memorized_transaction(false);
//   else
//       return create_memorized_transaction(true);
// }


// This is NetSuite's create_memorize function for reference
// function create_memorized_transaction(create) {
//     var actionsave = document.forms['main_form'].action;
//     document.forms['main_form'].action = addParamToURL(document.forms['main_form'].action,'memorize','T');
//     if (!create)
//     {
//         document.forms['main_form'].action = addParamToURL(document.forms['main_form'].action,'memupdate','T');
//     }
//     if (NS.form.isValid() && save_record())  {
//     NS.form.setChanged(true);
//     return true; }
//     document.forms['main_form'].action = actionsave;
//     return false;
// }
