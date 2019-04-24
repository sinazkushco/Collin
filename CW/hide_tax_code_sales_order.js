var context = nlapiGetContext();
var exec = context.getExecutionContext();
var role = context.getRole();

/** fires when an existing line is selected
 * essentially, pageInit for sublist line items
 * @param type      string          the sublist internal ID
 */
function disable_taxcode_display(type){
  	alert('hello hello');
    nlapiLogExecution('DEBUG','type',type);
    if(exec === 'userinterface'){
        if(type === 'item'){
            nlapiLogExecution('DEBUG','DISABLE TAX CODE');
            // nlapiGetCurrentLineItemIndex(type);
            nlapiDisableLineItemField('item', 'taxcode_display', true);
        }
      	else {
          if (role == 3){
            alert(type);
          }
        }
    }
}

function validateField(type, name, linenum){
  alert('hello');
  if (role == 3){
    console.log('validating field: '+ name);
    if (type == 'item'){
    	alert(name +' | '+linenum);
  	} else {
    	console.log(type);
  	}
  }
}

function pageinit(type){alert('hello')}


