/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.beforeLoad = function (context) {
        var currentRecord = context.newRecord;
        var form = context.form;
        var is_payment_hold = currentRecord.getValue('custbody_payment_hold_backorder');
        if (is_payment_hold) {
            form.clientScriptFileId = 1060244;
            form.addButton({
                id: 'custpage_update_ph_status',
                label: 'Check Customer Deposits Payment Hold',
                functionName: 'update_payment_hold_status'
            });
        }
    };
});
// function update_payment_hold_status(){
//     log.debug('CALLED','OMG PLEASE');
//     var total_cd_amount_search = search.create({
//         type: "customerdeposit",
//         filters:
//             [
//                 ["type", "anyof", "CustDep"],
//                 "AND",
//                 ["salesorder.internalidnumber", "equalto", sales_order_id],
//                 "AND",
//                 ["salesorder.custbody_payment_hold_backorder", "is", "T"]
//             ],
//         columns:
//             [
//                 search.createColumn({
//                     name: "tranid",
//                     join: "salesOrder",
//                     summary: "GROUP"
//                 }),
//                 search.createColumn({
//                     name: "amount",
//                     summary: "SUM"
//                 }),
//                 search.createColumn({
//                     name: "amount",
//                     join: "salesOrder",
//                     summary: "MAX"
//                 }),
//                 search.createColumn({
//                     name: "internalid",
//                     join: "salesOrder",
//                     summary: "GROUP"
//                 })
//             ]
//     });
//     var searchResultCount = total_cd_amount_search.runPaged().count;
//     log.debug("itemSearchObj result count", searchResultCount);
//     var alert_message = 'Customer needs customer deposit(s) applied to this order that is equal to or greater than the sales order total';
//     if (searchResultCount) {
//         total_cd_amount_search.run().each(function (result) {
//             var result_object = result.getAllValues();
//             var cd_amount = result_object['SUM(amount)'];
//             var so_amount = result_object['MAX(salesOrder.amount)'];
//             if (cd_amount >= so_amount) {
//                 currentRecord.setValue({
//                     fieldId: 'custbody_payment_hold_backorder',
//                     value: false
//                 })
//                 currentRecord.setValue({
//                     fieldId: 'custbody_payment_hold_end_date',
//                     value: ''
//                 })
//             }else{
//                 alert(alert_message);
//             }
//             return true;
//         })
//     }else {
//         alert(alert_message);
//     }
// }
