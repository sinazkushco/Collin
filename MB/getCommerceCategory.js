
/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// REQUIREMENTS:
// On close of record, search for related Commerce Category
// update Commerce Category field (to be created)
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

define(['N/runtime', 'N/log', 'N/record', 'N/search'],
    function (runtime, log, record, search) {
        function afterSubmit(context) {
            var recordType = context.newRecord.type


            //get current record
            var currentRecord = context.newRecord;

            var internalId = currentRecord.getValue({
                fieldId: 'internalid'
            })

            var commerceCategories = [];

            var commercecategorySearchObj = search.create({
                type: "commercecategory",
                filters:
                    [
                        ["catalog", "anyof", "1"],
                        "AND",
                        ["item", "anyof", internalId]
                    ],
                columns:
                    [
                        "name",
                        "primaryparent",
                        "description",
                        "pagetitle",
                        "catalog",
                        "urlcommcat",
                        "fullurl",
                        "idpath",
                        "primarycategory"
                    ]
            });
            var searchResultCount = commercecategorySearchObj.runPaged().count;
            if (!searchResultCount) {
                record.submitFields({
                    type: recordType,
                    id: currentRecord.id,
                    values: {
                        'custitem_comm_cat': 'No Commerce Category Found'
                    }
                });
            }

            commercecategorySearchObj.run().each(function (result) {
                commerceCategories.push(result.getValue('fullurl'))
                return true;
            });

            var categoryString = '';
            var lineBreak = '\n';

            for (var i = 0; i < commerceCategories.length; i++) {
                categoryString += commerceCategories[i] + lineBreak;
            };

            record.submitFields({
                type: recordType,
                id: currentRecord.id,
                values: {
                    'custitem_comm_cat': categoryString
                }
            });
        }

        return { afterSubmit: afterSubmit };
    })




