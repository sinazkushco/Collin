// deprecated.  incorporated into RS_setDefaultAccount.js
// https://system.na2.netsuite.com/app/common/media/mediaitem.nl?uploadrectype=custformscript&id=1974


//Published by Matt Barnett
//check if credit processor is CyberSource Live
// netsuite id: _setdefault_creditsourcecode

var context = nlapiGetContext();
var env = context.getEnvironment();

/** fires after a field has changed and all child (dependent) field values are sourced from the server
 * essentially, fieldChanged but after dependent values have been set
 * @param type      string          the sublist internal ID
 * @param name      string          the field internal ID
 * */
function postSourcing_paymentmethod(type, name){
  if (name == 'paymentmethod') {
    setDefaultAccount();
  }
}

//order of operations:
// on change of Payment Method field,
//  creditcardprocessor is sourced twice
//   and then paymentmethod gets sourced
function setDefaultAccount(name){
  var creditcardprocessor = nlapiGetFieldValue('creditcardprocessor');
  var cchold = nlapiGetFieldValue('cchold');

  if (env === 'PRODUCTION') {
    //cybersource is '2'.
    if (creditcardprocessor === '2' && cchold !== 'T'){
      nlapiSetFieldValue('undepfunds', 'F'); //de-select undepfunds
      nlapiSetFieldValue('account', '521'); //select account code 1151
    }
  } else {
    if (
      //in sandbox, cybersource isnt always on. so we check credit card instead.
      // fyi cybersource is dependent on the credit card fields.
      nlapiGetFieldValue('paymentmethod') === '5' //VISA
      || nlapiGetFieldValue('paymentmethod') === '4' //MasterCard
      || nlapiGetFieldValue('paymentmethod') === '3' //Discover
      || nlapiGetFieldValue('paymentmethod') === '6'  //AMEX

      && cchold !== 'T'
    )
    {
      nlapiSetFieldValue('undepfunds', 'F'); //de-select undepfunds
      nlapiSetFieldValue('account', '521'); //select account code 1151
    }
  }
}