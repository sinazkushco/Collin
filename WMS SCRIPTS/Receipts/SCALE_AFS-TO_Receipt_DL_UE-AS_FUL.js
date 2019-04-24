/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       2018-01-07      Donald Tran         Created Script
 *
 */
/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope SameAccount
 *@NAmdConfig ../AzureStorage/config.json
 */
define(["N/record", "N/search", "N/runtime", '../Libraries/azure_module.js', '../Libraries/global_modules.js'],
    /**
     * Module params:
     * @param {object} azure_modules
     */
    function (record, search, runtime, azure_modules, global_modules) {
        function afterSubmit_generateReceiptBatchForTO(context) {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.SHIP || context.type === context.UserEventType.EDIT) {
                var itemfulfillment = context.newRecord;
                if (itemfulfillment) {
                    try {

                        //only care about fulfillments that are shipped
                        var shipped = itemfulfillment.getValue({ fieldId: 'shipstatus' }) === "C";

                        //if old record exist, only care about fulfillments that become shipped, from not shipped
                        var oldstatus_is_not_shipped = true;
                        var itemfulfillment_old = context.oldRecord;
                        if (itemfulfillment_old) {
                            oldstatus_is_not_shipped = itemfulfillment_old.getValue({ fieldId: 'shipstatus' }) !== "C";
                        }

                        if (shipped && oldstatus_is_not_shipped) {

                            //only care about itemfulfillment destinations being a scale enabled location
                            var tolocation_is_scaleenabled = false;
                            var transferlocation = itemfulfillment.getValue({ fieldId: 'transferlocation' });
                            if (transferlocation) {
                                tolocation_is_scaleenabled = search.lookupFields({
                                    type: 'location',
                                    id: transferlocation,
                                    columns: 'custrecord_scale_enabled'
                                })['custrecord_scale_enabled']; //boolean

                            }

                            if (tolocation_is_scaleenabled) {

                                //only care about itemfulfillments created from transferorders
                                var createdfrom_is_transferorder = false;
                                var createdfrom_id = itemfulfillment.getValue({ fieldId: 'createdfrom' }); //1613608
                                if (createdfrom_id) {
                                    var createdfrom_recordtype = search.lookupFields({
                                        type: 'transaction',
                                        id: createdfrom_id,
                                        columns: ['recordtype']
                                    })['recordtype'];
                                    if (createdfrom_recordtype === 'transferorder') {
                                        createdfrom_is_transferorder = true;
                                    }
                                }

                                if (createdfrom_is_transferorder) {
                                    var details = { transferorder: Number(createdfrom_id), itemfulfillment: itemfulfillment.id };
                                    log.audit({ title: "Creating Receipt Batch", details: details });

                                    //prep data to send
                                    var XML_TYPE = "Receipt";
                                    var itemfulfillment_options = { type: 'itemfulfillment', id: itemfulfillment.id };

                                    var successful_transferorder_update = record.submitFields({
                                        type: 'transferorder',
                                        id: createdfrom_id,
                                        values: {
                                            custbody_warehouse_status: '2'
                                        }
                                    });
                                    if (successful_transferorder_update) {

                                        //submit the batch to create a receipt.  also relies on global_modules.createScaleReceiptFromTOfulfillment
                                        var successful_batch_creation = azure_modules.on_demand_download(XML_TYPE, createdfrom_id, itemfulfillment_options);
                                        if (successful_batch_creation) {

                                            try {
                                                var randys_locking_script_did_not_block_me = record.submitFields({
                                                    type: 'transferorder',
                                                    id: createdfrom_id,
                                                    values: {
                                                        custbody_receipt_in_wms: true
                                                    }
                                                });
                                            } catch (error) {
                                                log.error({ title: 'randys code probably blocked me from editing the field', details: error })
                                            }
                                        }
                                    }
                                }

                            } else {
                                //custom logic for fulfillments to non-scale enabled locations
                            }

                        } //shipped
                    } catch (error) {
                        log.error({ title: 'error', details: error });
                        throw "Your fulfillment was successfully saved, but another error occurred."
                    }
                } //fulfillment
            }

        } //aftersubmit

        return {
            afterSubmit: afterSubmit_generateReceiptBatchForTO
        };
    });
