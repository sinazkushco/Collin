function RS_setDefaultAccount(type, name) {
    //Check to see if field changed is the Payment Method field
    if (name == 'paymentmethod') {
        //Find value of the Payment Method field now that we've confirmed it has been changed
        var paymentMethod = nlapiGetFieldValue('paymentmethod');

        //Check to see if payment method is "Pre-Pay - Cash"
        if (paymentMethod == '1') {
            setCashAccount();
        }
        //Check to see if payment method is "Payment on Delivery"
        else if (paymentMethod == "23") {
            var location = nlapiGetFieldValue('location');

            //Check if its Lawndale
            if (location == 5) {
                nlapiSetFieldValue('account', '461'); // 1106 CMP Cash in Safe
            }

        } else {
            //Run check to see if the payment processing profile is CyberSource
            //checkIfProcessorIs_CyberSource();
        }
    }
}

function setCashAccount() {
    //Find value of Location field on form
    var location = nlapiGetFieldValue('location');

    //California
    if (location == 1 || location == nlapiLookupField("customrecord_location_ref_rec", "1", "custrecord_lrr_netsuite_location")) {
        nlapiSetFieldValue('account', '143'); // 1171 Petty Cash - CA
    }

    //Washington
    else if (location == 2) {
        nlapiSetFieldValue('account', '145'); // 1173 Petty Cash - WA'
    }

    //Colorado
    else if (location == 3) {
        nlapiSetFieldValue('account', '144'); // 1172 Petty Cash - CO
    }

    //MedePen
    else if (location == 5) {
        nlapiSetFieldValue('account', '461'); // 1106 CMP Cash in Safe'


        //    nlapiSetFieldValue('inpt_account', '         1111 CMP Petty Cash');
        //    nlapiSetFieldValue('account', '466');
    }

    // MA - KB: Worcester, MA === 32
    else if (location == 32) {
     	var user = nlapiGetContext().user;
        if (user == '1229625') { // Ryan Holmes
            nlapiSetFieldValue('undepfunds', 'F');
            nlapiSetFieldValue('account', '671'); // 1185 Petty Cash - MI https://kushbottles.atlassian.net/browse/NSHD-2530
        } else {
            nlapiSetFieldValue('account', '648'); // 1183 Petty Cash - MA
        }
        
    }
}



/**
 * Published by Matt Barnett
 * check if credit processor is CyberSource Live
 *  set account to cybersource deposits if it is
 *
 * order of operations:
 * on change of Payment Method field,
 *  creditcardprocessor is sourced twice
 *   and then paymentmethod gets sourced
 */
function checkIfProcessorIs_CyberSource() {
    var creditcardprocessor = nlapiGetFieldValue('creditcardprocessor');
    var cchold = nlapiGetFieldValue('cchold');

    var context = nlapiGetContext();
    var env = context.getEnvironment();

    if (env === 'PRODUCTION') {
        //cybersource is '2'.
        if (creditcardprocessor === '2' && cchold !== 'T') {
            nlapiSetFieldValue('undepfunds', 'F'); //de-select undepfunds
            nlapiSetFieldValue('account', '521'); //select account code 1151
        }
    } else {
        //in sandbox, cybersource isnt always on. so we check credit card instead.
        // fyi cybersource is dependent on the credit card fields.
        if (
            nlapiGetFieldValue('paymentmethod') === '5' //VISA
            || nlapiGetFieldValue('paymentmethod') === '4' //MasterCard
            || nlapiGetFieldValue('paymentmethod') === '3' //Discover
            || nlapiGetFieldValue('paymentmethod') === '6'  //AMEX

            && cchold !== 'T'
        ) {
            nlapiSetFieldValue('undepfunds', 'F'); //de-select undepfunds
            nlapiSetFieldValue('account', '521'); //select account code 1151
        }
    }
}

function pageInit() {
    setTimeout(checkIfProcessorIs_CyberSource, 1000);
}