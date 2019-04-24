/**

 * @NApiVersion 2.0

 * @NScriptType MapReduceScript

 */

define(["N/search", "N/record", "N/log", "../Libraries/scale_utils.js"], function (search, record, log, utils) {
 

    function getInputData() {
   
    
   
    return search.create({
        type: "purchaseorder",
        filters:
        [
           ["datecreated","notafter","3/31/2019 11:59 pm"], 
           "AND", 
           ["custbody_warehouse_status","anyof","4"], 
           "AND", 
           ["cogs","is","F"], 
           "AND", 
           ["mainline","is","T"], 
           "AND", 
           ["type","anyof","PurchOrd"]
        ],
        columns:
        [
           "ordertype",
           "mainline",
           "trandate",
           "asofdate",
           "postingperiod",
           "taxperiod",
           "type",
           search.createColumn({
              name: "tranid",
              sort: search.Sort.DESC
           }),
           "entity",
           "custbody_warehouse_status",
           "datecreated"
        ]
     });

   
    }
    
   
    function map(context) {
   
    var searchResult = JSON.parse(context.value);
   
    // you have the result row. use it like this....
   
    var internalId = searchResult.id;
   
    var recordType = searchResult.values.type;
    
    utils.updateWarehouseStatus("purchaseorder", internalId);
    
   
    }
    
   
    return {
   
    getInputData: getInputData,
   
    map: map
   
    };
   
   });