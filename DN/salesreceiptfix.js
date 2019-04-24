function scheduled(type) {
    var cashSales = nlapiSearchRecord('cashsale', 'customsearch1020');
    for (var a = 0; a < cashSales.length; a++) {
        try {
            var cashSaleDoc = cashSales[a].getValue('tranid');
            var cashSaleId = cashSales[a].getValue('internalid');
            var depositId = cashSales[a].getValue('applyingtransaction');
            if(!depositId) {
                depositId = cashSales[a].getValue('custbody_log_at');
            }

            // UNLINK PROCESS
            try{
                nlapiLogExecution('DEBUG', 'UNLINKING CASH SALE '+ cashSaleDoc, 'cashsale: '+ cashSaleId);
                nlapiLogExecution('DEBUG', 'UNLINKING DEPOSIT', 'deposit: '+ depositId);
                var depositToUnlink = nlapiLoadRecord('deposit', depositId);
                var cashSaleIdx_unlink = depositToUnlink.findLineItemValue('payment', 'docnumber', cashSaleDoc);
                depositToUnlink.setLineItemValue('payment', 'deposit', cashSaleIdx_unlink, 'F');
                var unlinkSuccess = nlapiSubmitRecord(depositToUnlink);
                if (unlinkSuccess){
                    nlapiLogExecution('AUDIT', 'SUCCESSFUL UNLINK FOR DEPOSIT', 'deposit: '+ unlinkSuccess);

                    var old_LogAT = nlapiLookupField('cashsale', cashSaleId, 'custbody_log_at');
                    var new_LogAT = old_LogAT ? old_LogAT +", "+ depositId : depositId;
                    var logAT_set = nlapiSubmitField('cashsale', cashSaleId, 'custbody_log_at', new_LogAT);
                    if (logAT_set){
                        nlapiLogExecution('AUDIT', 'Log AT set on cashsale as applyingtransanction: '+new_LogAT, 'cashsale: '+ logAT_set);
                    } else {
                        nlapiLogExecution('ERROR', 'Log AT could not be set on cashsale as applyingtransanction:'+depositId, 'cashsale: '+ cashSaleId);
                    }
                } else {
                    nlapiLogExecution('ERROR', 'UNSUCCESSFUL UNLINK FOR DEPOSIT', 'deposit: '+ depositId)
                }
            } catch (unlinkError){
                nlapiLogExecution('ERROR', 'Error thrown on Unlink block: '+ unlinkError.message, 'cashsale: '+ cashSaleId);
            }


            // TRIGGER CASH SALE UPDATE
            if (unlinkSuccess){
                try {
                    var cashSale = nlapiLoadRecord('cashsale', cashSaleId);
                    //cashSale.setFieldValue('taxamountoverride', 9.15); // this is copied to Tax (taxtotal) in the Summary box
                    //cashSale.setFieldValue('taxamountoverride', cashSale.getFieldValue('taxtotal')); // to make it dynamic 
                    var targetTax = cashSale.getFieldValue('custpage_ava_totaltax');
                    var currentTax = cashSale.getFieldValue('taxtotal');

                    cashSale.setFieldValue('taxamountoverride', targetTax); // to make it dynamic 
                    cashSale.selectNewLineItem('item');
                    cashSale.setCurrentLineItemValue('item', 'item', 9783); // newly created correction item (Item Type: Service for Sale)
                    cashSale.setCurrentLineItemValue('item', 'location', 4); // mandatory column; any location should be OK
                    cashSale.setCurrentLineItemValue('item', 'amount', 0);
                    cashSale.setCurrentLineItemValue('item', 'taxcode', 9782); // newly created tax code
                    cashSale.commitLineItem('item');

                    var cashsaleSuccess = nlapiSubmitRecord(cashSale);
                    if (cashsaleSuccess) {
                        nlapiLogExecution('AUDIT', 'SUCCESSFUL UPDATE FOR CASH SALE', 'cashsale: ' + cashsaleSuccess);
                    } else {
                        nlapiLogExecution('ERROR', 'UNSUCCESSFUL UPDATE FOR CASH SALE', 'cashsale: ' + cashSaleId);
                    }
                } catch (updateError){
                    nlapiLogExecution('ERROR', 'Error thrown on Update block: '+ updateError.message, 'cashsale: '+ cashSaleId);
                }
            }

            // RELINK PROCESS
            if (unlinkSuccess){
                try {
                    nlapiLogExecution('DEBUG', 'RELINKING CASH SALE ' + cashSaleDoc, 'cashsale: ' + cashSaleId);
                    nlapiLogExecution('DEBUG', 'RELINKING DEPOSIT', 'deposit: ' + depositId);
                    var depositToRelink = nlapiLoadRecord('deposit', depositId);
                    var cashSaleIdx_relink = depositToRelink.findLineItemValue('payment', 'docnumber', cashSaleDoc);
                    depositToRelink.setLineItemValue('payment', 'deposit', cashSaleIdx_relink, 'T');
                    var relinkSuccess = nlapiSubmitRecord(depositToRelink);
                    if (relinkSuccess) {
                        nlapiLogExecution('AUDIT', 'SUCCESSFUL RELINK FOR DEPOSIT', 'deposit: ' + relinkSuccess);
                    } else {
                        nlapiLogExecution('ERROR', 'UNSUCCESSFUL RELINK FOR DEPOSIT', 'deposit: ' + depositId)
                    }
                } catch (relinkError){
                    nlapiLogExecution('ERROR', 'Error thrown on Relink block: '+ relinkError.message, 'cashsale: '+ cashSaleId);
                }
            }

        } catch (fatal_error) {
            nlapiLogExecution('ERROR', 'Fatal Error', fatal_error.message);
        }

        var remainingUsage = nlapiGetContext().getRemainingUsage();
        nlapiLogExecution('debug', 'remainingUsage', remainingUsage);
        if (remainingUsage <= 100) {
            var stateMain = nlapiYieldScript();
            if (stateMain.status == 'FAILURE') {
                nlapiLogExecution("error",
                    "Failed to yield script (do-while), exiting: Reason = " +
                    stateMain.reason + " / Size = " +
                    stateMain.size);
                throw "Failed to yield script";
            } else if (stateMain.status == 'RESUME') {
                nlapiLogExecution("audit",
                    "Resuming script (do-while) because of " +
                    stateMain.reason + ". Size = " +
                    stateMain.size);
            }
        }
    }
}