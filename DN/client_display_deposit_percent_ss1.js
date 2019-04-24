function displayCdAndOverdueBalance() {
    var projectId = nlapiGetRecordId();
    var soField = nlapiLookupField("job", projectId, "custentity_pm_sales_order_record");
    var customerField = nlapiLookupField("job", projectId, "customer");

    if (soField) {
        findCdAmount(soField, customerField, projectId);
        // display string message
    }
    if (customerField) {
        findOverdueBalanceAmount(customerField);
    }
    return;
}

function findCdAmount(soId, customerId, projectId) {
    //console.log("findCdAmount ran");
    var thirdColumn = jQuery("#tr_fg_fieldGroup361 > td")[2];
    var totalSoAmount = nlapiLookupField("salesorder", soId, "total");
    var customerInfo = nlapiLookupField("customer", customerId, ["custentity_customer_type", "terms"]);
    var customerType = customerInfo.custentity_customer_type;
    var terms = customerInfo.terms;
    var repeatOrder = nlapiLookupField("job", projectId, "custentity_rerun");
    var messageColor = "red";
    var totalCdAmount;
    var msg;
    var threshold = 50;

    //if terms exist
    if (terms && terms != "4" && terms != "8") {
        if (customerType == "2" && repeatOrder) { // No Deposit Needed
            return;
        }
        if (customerType == "1" && repeatOrder) { // Commerical
            threshold = 25;
        } else if (customerType == "2") { // National
            threshold = 25;
        }
    }

    var customerdepositSearch = nlapiSearchRecord("customerdeposit", null,
        [
            ["type", "anyof", "CustDep"],
            "AND",
            ["salesorder", "anyof", soId]
        ],
        [
            new nlobjSearchColumn("salesorder", null, "GROUP"),
            new nlobjSearchColumn("amount", null, "SUM")
        ]
    );

    if (customerdepositSearch) {
        totalCdAmount = customerdepositSearch[0].getValue("amount", null, "SUM");
    }


    if (totalCdAmount) {
        var cdPercentage = (Number(totalCdAmount) / Number(totalSoAmount) * 100);

        if (cdPercentage >= threshold) {
            messageColor = "green";
        }

        msg = cdPercentage.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0] + "% of $" + Number(totalSoAmount).toLocaleString("en-US", {
            style: "decimal",
            minimumFractionDigits: 2
        }) + " deposited.";
    } else {
        msg = "0% of $" + Number(totalSoAmount).toLocaleString("en-US", {
            style: "decimal",
            minimumFractionDigits: 2
        }) + " deposited.";
    }

    if (msg) {
        jQuery(thirdColumn).append(createMessageElement(msg, messageColor));
    }


}

function findOverdueBalanceAmount(customerId) {
    var thirdColumn = jQuery("#tr_fg_fieldGroup361 > td")[2];
    var msg;
    var overDueBalance = nlapiLookupField("customer", customerId, "overduebalance");

    if (overDueBalance != ".00") {
        msg = "Overdue balance of $" + Number(overDueBalance).toLocaleString("en-US", {
            style: "decimal",
            minimumFractionDigits: 2
        });
    }

    if (msg) {
        jQuery(thirdColumn).append(createMessageElement(msg));
    }
}

function createMessageElement(msg, color) {
    var element = '<tr>' +
        '<td>' +
        '<div class="uir-field-wrapper" data-field-type="inlinehtml">' +
        '<span id="custentity_has_balance_fs" class="text">' +
        '<span id="custentity_has_balance_val">' +
        '<div style="font-size:14px;color:' + color + ' !important;font-weight:bold;padding-top:10px">' +
        msg +
        '</div>' +
        '</span>' +
        '</span>' +
        '</div>' +
        '</td>' +
        '</tr>';
    return element;
}

displayCdAndOverdueBalance();