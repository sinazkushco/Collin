/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/log", "N/runtime", "N/search"], function (record, log, runtime, search) {

    // // @TODO: beforeload, enable the custitem_skuba_class dropdown field if context.type is Create or Copy
    // // OR a client script to zero out the SKUBA field if SKUBA Class doesnt match the SKUBA.  or even a beforesubmit...
    // function beforeLoad(context) {
    //
    // }

    /////////////////////////////////////////// THIS NEEDS TO BE DEPLOYED BEFORE ANY wms on demand SCRIPTS ////////////////////////////////////////

    function beforeSubmit_setSKUfields(context) {
        if (
            context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.COPY ||
            context.type === context.UserEventType.EDIT
        ) {
            var currentRecord = context.newRecord;

            //forgive me for these variable names.  there is no let/const so assume ALLCAPS is CONST, and lowercase is LET
            var rec = {
                ITEM_CLASS: currentRecord.getValue({fieldId: 'class'}),
                sku: currentRecord.getValue({fieldId: 'custitem_sku'}),
                skuba: currentRecord.getValue({fieldId: 'custitem_sku_base'}),
                SKUBA_CLASS: currentRecord.getValue({fieldId: 'custitem_skuba_class'}),
                skupr: currentRecord.getValue({fieldId: 'custitem_sku_pr'}),
                CUSTOM_PRODUCT: currentRecord.getValue({fieldId: 'custitem2'})
            };

            if (rec.sku && rec.skupr){
                var sku = rec.sku || '';
                var dont_change_sku_for_deprecated_items = sku.substring( sku.indexOf(rec.skupr) + rec.skupr.length );

                if (sku.length > 14 && "-OLD" === dont_change_sku_for_deprecated_items){
                    return;
                }
            }

            if (rec.ITEM_CLASS) {
                try {

                    //some old items dont have SKUBA Class because it was added later.  lets default those to "1", which all our old SKUs should be using
                    if (rec.SKUBA_CLASS === ''){
                        rec.SKUBA_CLASS = "1";
                        currentRecord.setValue({
                            fieldId: 'custitem_skuba_class',
                            value: "1"
                        });
                    }

                    if (rec.skuba === '') {
                        var currentSKUBAincrement = getCurrentSKUBAincrement(rec.SKUBA_CLASS);
                        rec.skuba = getNextSKUBAincrement(currentSKUBAincrement);
                        currentRecord.setValue({
                            fieldId: 'custitem_sku_base',
                            value: rec.skuba
                        });
                    }

                    //Quality-of-Data: prevent the user from deleting and emptying this field
                    if (rec.skupr === '') {
                        rec.skupr = '000000';
                        currentRecord.setValue({
                            fieldId: 'custitem_sku_pr',
                            value: rec.skupr
                        });
                    }
                    //Quality-of-Data: ensures a custom is set to default to 999999
                    if (rec.skupr === '000000' && rec.CUSTOM_PRODUCT) {
                        rec.skupr = '999999';
                        currentRecord.setValue({
                            fieldId: 'custitem_sku_pr',
                            value: rec.skupr
                        });
                    }
                    //Quality-of-Data: ensures a base item is set to default to 000000
                    else if (rec.skupr === '999999' && !rec.CUSTOM_PRODUCT) {
                        rec.skupr = '000000';
                        currentRecord.setValue({
                            fieldId: 'custitem_sku_pr',
                            value: rec.skupr
                        });
                    }

                    //build SKU from SKUBA and SKUPR
                    if (rec.skuba && rec.skupr) {
                        rec.sku = rec.skuba + '-' + rec.skupr;

                        var duplicate_sku_exists = find_duplicate_sku(rec.sku, currentRecord.id);
                        if (duplicate_sku_exists){
                            throw "Duplicate SKU Exists: " + duplicate_sku_exists;
                        }

                        currentRecord.setValue({
                            fieldId: 'custitem_sku',
                            value: rec.sku
                        });
                    }
                } catch (error) {
                    log.error({title: 'BeforeSubmit: Cant set SKU', details: error});
                    log.error({title: 'BeforeSubmit: currentRecord', details: rec});
                    throw "Error when creating SKU.  Your item was most likely NOT saved.  Please submit a <u>BUG REPORT</u> to the <a href='https://kushbottles.atlassian.net/servicedesk/customer/portal/4/create/111' target='_blank'>NetSuite Help Desk</a> with the following message: "
                    + "<br><br>" + JSON.stringify(error)
                    + "<br><br>" + JSON.stringify(rec);
                }
            } // ITEM_CLASS
        } // if context.type
    } // beforeSubmit

    function afterSubmit_update_autoincrementer(context) {
        if (
            context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.COPY ||
            context.type === context.UserEventType.EDIT
        ) {
            var newRecord = context.newRecord;
            var rec = {
                ITEM_CLASS: newRecord.getValue({fieldId: 'class'}),
                SKU: newRecord.getValue({fieldId: 'custitem_sku'}),
                SKUBA: newRecord.getValue({fieldId: 'custitem_sku_base'}),
                SKUBA_CLASS: newRecord.getValue({fieldId: 'custitem_skuba_class'})
            };

            if (rec.ITEM_CLASS && rec.SKU && rec.SKUBA && rec.SKUBA_CLASS) {

                try {
                    var old_increment = getCurrentSKUBAincrement(rec.SKUBA_CLASS);
                    var new_increment = getNextSKUBAincrement(old_increment);

                    if (rec.SKUBA === new_increment) {
                        var customrecord_autoincrementSearchObj = search.create({
                            type: "customrecord_autoincrement",
                            filters:
                                [
                                    ["custrecord_increment", "is", old_increment],
                                    "AND",
                                    ["custrecord_skuba_prefix", "anyof", rec.SKUBA_CLASS]
                                ],
                            columns:
                                [
                                    search.createColumn({name: "internalid", label: "Internal ID"})
                                ]
                        });
                        var results = customrecord_autoincrementSearchObj.run().getRange({start: 0, end: 1});
                        if (results.length) {
                            var autoincrement_INTERNALID = results[0].getValue({name: 'internalid'});
                            record.submitFields({
                                type: 'customrecord_autoincrement',
                                id: autoincrement_INTERNALID,
                                values: {
                                    'custrecord_increment': new_increment
                                }
                            });
                        } else {
                            var message = "No results found for filters.";
                            log.error({title: message + "  Old Inc:" + old_increment +' | SKUBA Class: '+ rec.SKUBA_CLASS, details: rec});
                            throw message;
                        }//results.length
                    } // SKUBA === new_increment

                } catch (error){
                    log.error({title: 'AfterSubmit: Cant set SKU', details: error});
                    log.error({title: 'AfterSubmit: newRecord', details: rec});
                    throw "Your item was saved SUCCESSFULLY, but there was an error in creating the SKU.  Please let the Purchasing team know, and please submit a <u>BUG REPORT</u> to the <a href='https://kushbottles.atlassian.net/servicedesk/customer/portal/4/create/111' target='_blank'>NetSuite Help Desk</a> with the following message: "
                    + "<br><br>" + JSON.stringify(error)
                    + "<br><br>" + JSON.stringify(rec);
                }

                try {
                    submitExternalID(newRecord);
                } catch (error){
                    throw "After Submit: Error updating ExternalID: " + error;
                }

            }// ITEM_CLASS && SKU && SKUBA && SKUBA_CLASS
        } // if context.type
    } // afterSubmit

    /**
     * /////////////////////////////////////////////////////// HELPER FUNCTIONS ///////////////////////////////////////////////////////////////////////
     * Keep these functions pure.  Make sure they return consistent data.  Make sure they either RETURN a value or call other functions that return values.
     */

    function getCurrentSKUBAincrement(skuba_class) {
        var customrecord_autoincrementSearchObj = search.create({
            type: "customrecord_autoincrement",
            filters:
                [
                    ["custrecord_skuba_prefix", "anyof", skuba_class]
                ],
            columns:
                [
                    search.createColumn({name: "custrecord_increment", label: "Current Increment"}),
                    search.createColumn({name: "custrecord_skuba_prefix", label: "SKUBA Prefix"})
                ]
        });
        var results = customrecord_autoincrementSearchObj.run().getRange({start: 0, end: 1});

        return results.length ? results[0].getValue({name: 'custrecord_increment'}) : false;
    }

    function getNextSKUBAincrement(skuba) {
        try {
            if (!skuba) {
                throw 'getCurrentSKUBAincrement(skuba_class) returned -> ' + skuba + '.  did the customlist_skuba_class list get messed up?';
            }
            skuba = skuba.toString();
            var first_char_is_letter = isNaN(skuba[0]);

            var length = first_char_is_letter ? skuba.substr(1).length : skuba.length;
            var skuba_as_number = parseInt(skuba.substr(-length), 10);
            var next_increment = (++skuba_as_number).toString();

            if (first_char_is_letter) {
                var prefix = skuba[0] + "00000";
                var length_to_prepend = skuba.length - next_increment.length;
                var prepend = prefix.substr(0, length_to_prepend);
                next_increment = prepend + next_increment;
            } else {
                //future code for when we have OVER NINE MILLION unspecified SKUs.
            }
            return next_increment;
        } catch (error) {
            log.error({title: 'cant find Auto-Inc where custrecord_skuba_prefix is skuba_class ?', details: error});
            throw error;
        }
    }

    function find_duplicate_sku(sku, itemrecordid) {
        var itemSearchObj = search.create({
            type: "item",
            filters:
                [
                    ["type", "anyof", "Assembly", "InvtPart"],
                    "AND",
                    ["isinactive", "is", "F"],
                    "AND",
                    ["custitem_sku", "is", sku]
                ],
            columns:
                [
                    search.createColumn({
                        name: "itemid",
                        sort: search.Sort.ASC
                    }),
                    "custitem_sku",
                    "externalid"
                ]
        });
        if(itemrecordid){
            var filters = itemSearchObj.filters
            filters.push(search.createFilter({
                name: 'internalidnumber',
                operator: search.Operator.NOTEQUALTO,
                values: itemrecordid
            }))
            itemSearchObj.filters = filters
        }
        var searchResultCount = itemSearchObj.runPaged().count;

        if (searchResultCount) {
            return sku
        }
        return ''
    }

    function submitExternalID(currentRecord) {
        var sku = currentRecord.getValue('custitem_sku');
        var success = record.submitFields({
            type: currentRecord.type,
            id: currentRecord.id,
            values: {
                externalid: sku
            }
        });
        var externalid_updated = search.lookupFields({
            type: currentRecord.type,
            id: currentRecord.id,
            columns: 'externalid'
        })['externalid'];
        var externalid_value = externalid_updated instanceof Array ? externalid_updated[0].value : externalid_updated.value; //WHY DOES 2.0 RETURN externalid AS AN ARRAY OF ONE OF {text,value}

        var sku_mismatch_with_externalid = success && externalid_updated && sku !== externalid_value;
        if (sku_mismatch_with_externalid){
            throw 'Duplicate External Id: ' + sku;
        }
    }

    return {
        beforeSubmit: beforeSubmit_setSKUfields,
        afterSubmit: afterSubmit_update_autoincrementer
    };
});