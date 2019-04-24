function BSP_CustomerBeforeLoad(type,form)
{
    if (type != "create") {
        return;
    }

    var currUser = 0;
    var salesRep = 0;

    var currentContext = nlapiGetContext();
    if ((currentContext == undefined) || (currentContext == null)) {
        return;
    }

    var execContext = currentContext.getExecutionContext();
    if ((execContext == undefined) || (execContext == null)) {
        return;
    }

    if (execContext == "webstore") {
        // currUser = 5464; // House Account Sandbox
        // currUser = 519; // House Account Production
        currUser = 1179758; // Customer Service Team
        salesRep = 4926; // Online Account Production
    }
  	else if(execContext == "webservices"){
        // currUser = 519; // House Account
        currUser = 1179758; // Customer Service Team
      	salesRep = 17399; //Act-On Form
    }
    else {
        currUser = currentContext.getUser();
      	salesRep = currUser;
        if ((currUser == undefined) || (currUser == null) || (currUser == "")) {
            return;
        }
    }

    if (currUser > 0)
    {
        nlapiSetFieldValue("custentity3", salesRep);
        nlapiSetFieldValue("salesrep", currUser);
    }

    if (execContext == "webstore") {
        return; // Customer ID will be updated via Scheduled Script for Web Customers
    }

    var customerID = "";
    var lastCustomerID = "";
    var searchresults = nlapiSearchRecord("customer", 107);
    if (searchresults != null) {
        if (searchresults.length > 0) {
            var searchresult = searchresults[0];
            var internalID = searchresult.getId();
            customerID = nlapiLookupField("customer", internalID, "custentitycustomerid");
            if (lastCustomerID == "") {
                lastCustomerID = customerID;
            }
        }
    }

    if (lastCustomerID == "") {
        customerID = "C0000001";
    }
    else {
        if(lastCustomerID){
            var customerNum = parseInt(lastCustomerID.substring(1), 10) + 1;
            customerID = "0000000" + customerNum.toString();
            customerID = "C" + customerID.substring(customerID.length - 7, customerID.length);
        }
    }

    nlapiSetFieldValue("custentitycustomerid", customerID);

}
