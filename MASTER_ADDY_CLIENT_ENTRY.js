var context = nlapiGetContext();
var exec = context.getExecutionContext();
var role = context.getRole();

/** fires when page completes loading or form is reset
 * @param type  string  {create copy edit}
 * essentially, js.onLoad */
function pageInit_master(type){
    if(exec == "userinterface"){
        var override = nlapiGetFieldValue("override");
        if(override == "F"){
            nlapiGetField("override").setDisplayType("disabled");
        }
        try{
            googleinit();	
        } catch(e){
        }
    
    }

}

function fieldchange_master(type, fldname, linenum){
    if(fldname === 'state'){
        nlapiSetFieldValue('zip','');
    }
}

/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function saveRecord_master(){
    if(exec == "userinterface"){
        var addressee = nlapiGetFieldValue("addressee");
        var addr1 = nlapiGetFieldValue("addr1");
        var city = nlapiGetFieldValue("city");
            if(!addressee || !addr1 || !city) {
                alert("Please enter value(s) for: Addressee, Address 1, Zip, City, State");
                return false;
            }
    }

  return true;
}