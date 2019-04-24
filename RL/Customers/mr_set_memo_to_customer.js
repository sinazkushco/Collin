/**
 *@NApiVersion 2.x
 *@NScriptType MapReduceScript
 *@NModuleScope SameAccount
 */

define(['N/search', 'N/record'],
    function (search, record) {
        var customerIdsCompleted = {};
        /**
        * Marks the beginning of the Map/Reduce process and generates input data.
        *
        * @typedef {Object} ObjectRef
        * @param {InputContext} context
        * @property {number} id - Internal ID of the record instance
        * @property {string} type - Record type id
        *
        * @return {Array|Object|Search|RecordRef} inputSummary
        * @since 2015.1
        */
        function getInputData(context) {
            return search.create({
                type: "note",
                filters:
                    [
                        ["entity.internalidnumber", "isnotempty", ""]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "entity"
                        }),
                        "author",
                        search.createColumn({
                            name: "notedate",
                            sort: search.Sort.DESC
                        }),
                        "title",
                        "note",
                        "direction",
                        "notetype",
                        "company"
                    ]
            });
        }

        /**
        * Executes when the map entry point is triggered and applies to each key/value pair.
        *
        * @param {MapContext} context - Data collection containing the key/value pairs to process through the map stage
        * @since 2015.1
        */
        function map(context) {
            var searchResult = JSON.parse(context.value);
            if (searchResult) {
                var customerId = searchResult.values["internalid.entity"].value;
                var recordType = search.lookupFields({ type: 'entity', id: customerId, columns: ['recordtype'] }).recordtype;

                if (recordType === 'customer' && !customerIdsCompleted[customerId]) {
                    // log.debug('Search Result', searchResult);

                    var title = searchResult.values.title;
                    var noteTypeText = searchResult.values.notetype;
                    var memo = searchResult.values.note;
                    var time = searchResult.values.notedate;

                    var collectionStatus = '' +
                        'Title: ' + title + '\n' +
                        'Type: ' + noteTypeText + '\n' +
                        'Date: ' + ' ' + time + '\n' +
                        'Memo: ' + memo + '\n\n';

                    log.debug('Updating ' + customerId + ':', collectionStatus);


                    record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: customerId,
                        values: {
                            'custentity_user_notes': collectionStatus
                        }
                    });

                    customerIdsCompleted[customerId] = true;
                }

            }
        }
        return {
            getInputData: getInputData,
            map: map
        };
    });