function update_payment_hold_status() {
    var sales_order_id = nlapiGetFieldValue('id');
    var customerdepositSearch = nlapiSearchRecord("customerdeposit", null,
        [
            ["type", "anyof", "CustDep"],
            "AND",
            ["salesorder.internalidnumber", "equalto", sales_order_id],
            "AND",
            ["salesorder.custbody_payment_hold_backorder", "is", "T"]
        ],
        [
            new nlobjSearchColumn("internalid", "salesOrder", "GROUP"),
            new nlobjSearchColumn("amount", null, "SUM"),
            new nlobjSearchColumn("amount", "salesOrder", "MAX")
        ]
    );
    var alert_message = 'Customer needs customer deposit(s) applied to this order that is equal to or greater than the sales order total';
    if (customerdepositSearch) {
        var cd_amount = customerdepositSearch[0].getValue("amount", null, "SUM");
        var so_amount = customerdepositSearch[0].getValue("amount", "customerDeposit", "SUM");
        if (cd_amount >= so_amount) {
            nlapiSetFieldValue('custbody_payment_hold_backorder', false);
            nlapiSetFieldValue('custbody_payment_hold_end_date', '');
        }
        else {
            alert(alert_message);
        }
    } else {
        alert(alert_message);
    }
}





