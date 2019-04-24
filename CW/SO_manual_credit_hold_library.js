//***********************************Client Manual Credit Hold***********************************************

function client_manual_credit_hold(exec) {
    if(exec === 'userinterface'){
        var manualCreditHold = nlapiGetFieldValue('manualcredithold');
        if (manualCreditHold == "T") {
            alert("Customer has a manual credit hold.");
            return false;
        }
    }
    return true;
}
//***********************************Client Manual Credit Hold End***********************************************