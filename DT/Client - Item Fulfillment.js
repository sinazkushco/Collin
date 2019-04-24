/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function pageInit_itemFulfillment(type){
    turn_on_fedEx_tracking_notification(type);
}


/**
 * automatically checks a box to notify the customer that something has been shipped to them.
 * the notification comes in the form of an email sent directly by fedex, based on info that this record passes to fedex directly
 */
function turn_on_fedEx_tracking_notification(type){
    nlapiSetFieldValue('sendshipnotifyemailfedex', true);
}