//simple function - user event script that loads a client side script.
// This can be used running scripts on view of records, since client scripts don't work on view context.

//button added in   BSP_KB_FedExInterface.js
//script deployed   loader-printProFormaInvoice.js
//functions set in  action_printProFormaInvoice.js

/** the button exists by default on the form, we are modifying its callback
 * this script deployment    loader-setDefault_ship_phone.js     https://system.netsuite.com/app/common/scripting/script.nl?id=499
 * calls another script      action-setDefault_ship_phone.js     https://system.netsuite.com/app/common/scripting/script.nl?id=500
 */

function beforeLoad_attachPrintProFormaInvoice(type, form) {
    if (nlapiGetContext().getExecutionContext() === 'userinterface' && type == 'view') {
        form.setScript('425'); //<< SCRIPT ID FOR action_printProFormaInvoice.js client side script
    }
}