var record, log, gm, azure_module, search;

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
      * @NAmdConfig ../AzureStorage/config.json
 */
define(["N/record", "N/log", "../Libraries/global_modules.js", '../Libraries/azure_module.js', 'N/search'], runSuitelet);

//********************** MAIN FUNCTION **********************
function runSuitelet(RECORD, LOG, GM, AZURE_MODULE, SEARCH) {
    record = RECORD;
    log = LOG;
    gm = GM;
    azure_module = AZURE_MODULE;
    search = SEARCH

    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}


function execute(context) {

    if (context.request.method == "POST") {
        log.debug('direction',context.request.parameters.direction)
        log.debug('recordType',  context.request.parameters.type)
    
        var batch_id = context.request.parameters.batchId;
        log.debug('batchId', batch_id)
        var json_string = search.lookupFields({type: 'customrecord_wms_queue_records', id: batch_id, columns: ['custrecord_wms_json']}).custrecord_wms_json
        var STR = {
            direction: context.request.parameters.direction,
            recordType: context.request.parameters.type,
            batchId: batch_id,
            json: JSON.parse(json_string)
        };
        var TYPES = {};
        for (var key in STR){
            TYPES[key] = typeof STR[key];
        }
        STR.TYPES = TYPES;

        var recordTypeMap = {
            "BillofMaterials": 'BillOfMaterial',
            "ItemRecord": "Item",
            "ShipmentRecords": 'Shipment',
            "WorkOrders": 'WorkOrder',
            "ReceiptRecords": 'Receipt'
        };

        log.debug({title: 'STR data', details: STR});
        try {
            if (STR.direction === "Inbound") {
                if (STR.recordType === "Shipment Records") {
                    var fulId = gm.updateItemFulfillment(STR.json);
                    log.debug('fulId',fulId);
                    gm.updateQueueRecord(STR.batchId, "COMPLETE", fulId);                			 	 } else if (STR.recordType === "Receipt Records") {
                    gm.createItemReceipt(STR.json);
                } else if (STR.recordType === "Inventory Transaction") {
                    gm.process_inventorytransaction_STR(STR.json, STR.batchId, true);
                }
            } else if (STR.direction === "Outbound") {
                var record_type_no_space = STR.recordType.split(' ').join('');
                log.debug("record_type_no_space", record_type_no_space);
                gm.updateQueueRecord(STR.batchId, "OPEN");
                azure_module.on_demand_reprocess(STR.batchId, recordTypeMap[record_type_no_space]);
            }

        } catch (e) {
            log.debug({title: 'caught error during reprocessing', details: e});
            gm.updateQueueRecord(STR.batchId, "ERROR", e);
        }

        return context.response.write(JSON.stringify({
            status: "success"
        }));


    }
}