//simple function - user event script that loads a client side script.
// This can be used for viewing records, as client scripts don't work on view.

//button exists by default on the form
//this script deployment    loader-setDefault_ship_phone.js     https://system.netsuite.com/app/common/scripting/script.nl?id=491
//loads another script      action-setDefault_ship_phone.js     https://system.netsuite.com/app/common/scripting/script.nl?id=490

function beforeLoad_attach_setShipPhone(type, form) {
  nlapiLogExecution("debug", "loader function", "ran");
   nlapiLogExecution("debug", "nlapiGetContext().getExecutionContext()", nlapiGetContext().getExecutionContext());
   nlapiLogExecution("debug", "type", type);
    if (nlapiGetContext().getExecutionContext() === 'userinterface' && type == 'view') {
      setShip_phone();
        //form.setScript('customscript_setdefault_shipphone'); //<< SCRIPT ID FOR action_printProFormaInvoice.js client side script
    }
}

// lookup shipphone field.
// If field is empty ('')
//set shipphone field to "(000) 000-0000"
function setShip_phone(){
    var FIELDS_TO_LOOKUP = ['shipphone', 'entity']
    var fields = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), FIELDS_TO_LOOKUP)
    if(fields.shipphone === "" || fields.shipphone === null){
        var phone_default = '(000) 000-0000'; //default
        var phone_customer = nlapiLookupField('customer', fields.entity, 'phone');

        var shipphone = phone_customer.length > 0 ? phone_customer : phone_default;
        nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), 'shipphone', shipphone)
        // console.log('Ship Phone not set.  Setting Default to: (000) 000-0000')
    }
}
