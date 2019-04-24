var context = nlapiGetContext();
var exec = context.getExecutionContext();
var role = context.getRole();
var user_id = context.getUser();

var enterpriseSelections = {
    "6" : "Enterprise Tier 1",
    "3" : "Enterprise Tier 2"
}



function field_change_master(type, fldname, linenum) {
    if (exec == 'userinterface') {
        if (fldname == 'salesrep') {
            setCustomerTerritory()
        }
    }
    return true;
}


// called on field change, enter function if field change is 'account manager'
function setCustomerTerritory() {
    var salesRepId = nlapiGetFieldValue('salesrep');
    var customrecord_geolocationSearch = nlapiSearchRecord("customrecord_geolocation", null,
        [
            ["custrecord_tsm.internalidnumber", "equalto", salesRepId]
        ],
        [
            new nlobjSearchColumn("custrecord_territory", null, "GROUP")
        ]
    );
    if(customrecord_geolocationSearch){
        var territoryCode = customrecord_geolocationSearch[0].rawValues[0].value;
        nlapiSetFieldValue('territory', territoryCode)
    }else{
        nlapiSetFieldValue('territory', '')
    }
}

//page init, sets customer category based on customer type
function RS_CustomerPageInit(type) {

    var context = nlapiGetContext();
    if (!context) { return ; }
  
    var execContext = context.getExecutionContext();
    if (!execContext) { return; }

    //set customer territory
    if(execContext == 'userinterface'){
        setCustomerTerritory()
    }
  
    if (execContext != 'webstore' && type == 'edit') {
      var user = context.getUser();
      var role = context.getRole();
  
      var blockedRoles = ["1006", "1044"]; //Sales Person and Territory Sales Manager roles
      var blockedUsers = ["541", "530", "112898"]; //Brice Murtaugh, Phil McCutcheon, ???
  
      if(blockedRoles.indexOf(role) > -1 || blockedUsers.indexOf(user) > -1){
        nlapiSetFieldDisabled('salesrep',true);
      }
    }
  }



