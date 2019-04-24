function scheduled (type) {
    //sift through execution logs to get applyingtransaction number
    var results = nlapiSearchRecord("scriptexecutionlog", null,
        [
            ["scripttype", "anyof", "442"],
            "AND",
            ["title", "startswith", "UNLINKING CASH SALE | DEPOSIT"]
        ],
        [
            new nlobjSearchColumn("view", null, null).setSort(false),
            new nlobjSearchColumn("title", null, null),
            new nlobjSearchColumn("detail", null, null)
        ]
    );

    nlapiLogExecution('DEBUG','Starting script:', results.length);

    //get the document numbers and applyingtransaction numbers of each row
    for (var row = 0; row < results.length; row++) {
        var data = results[row].getValue('detail');
        var docnumber = data.split(' | ')[0];
        var applyingtransaction = data.split(' | ')[1];

        //use doc numbers to get internalid
        var cashsaleSearch = nlapiSearchRecord("cashsale", null,
            [
                ["number", "equalto", docnumber],
                "AND",
                ["type", "anyof", "CashSale"],
                "AND",
                ["mainline", "is", "T"]
            ],
            [
                new nlobjSearchColumn("internalid", null, null),
                new nlobjSearchColumn("tranid", null, null)
            ]
        );
        var internalid = cashsaleSearch[0].getValue('internalid');

        //update SR with the applyingtxn number
        var success = nlapiSubmitField('cashsale', internalid, 'custbody_log_at', applyingtransaction);
        if (success) {
            nlapiLogExecution('AUDIT','SUCCESSFUL UPDATE for InternalID: '+ internalid, applyingtransaction);
        } else {
            nlapiLogExecution('ERROR','FAILED TO UPDATE InternalID: '+ internalid, applyingtransaction);
        }
    }
}