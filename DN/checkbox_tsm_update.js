// 2.0 - Fluent
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/log", "N/search", "N/runtime","../Library/moment"], function (record, log, search, runtime, moment) {
    function updateCustomerTSM(context) {
        log.debug("Progress Check: ", "Function is being called");
        log.debug("Context Check", runtime.executionContext + " " + runtime.ContextType.WEBSTORE);
        log.debug("Type Check", context.type);

        if (context.type !== "create") {
            return;
        }

        if (runtime.executionContext === runtime.ContextType.WEBSTORE) {
            return;
        }

        var newRecord = context.newRecord;
        var customerId = newRecord.getValue("id");

        //record is loaded because of billzip
        var customerRecord = record.load({
            type: "customer",
            id: customerId,
            isDynamic: false,
            defaultValues: null
        });

        var isBoxChecked = customerRecord.getValue("custentity_update_tsm_on_create");

        log.debug("Progress Check: Check Box Value", isBoxChecked);

        if (isBoxChecked) {
            log.debug("Progress Check: ", "First Conditional: Box is checked");
            //var customerId = newRecord.getValue("entity");

            // var currentSalesRep = customerRecord.getValue("salesrep");
            var zipcode = customerRecord.getValue("billzip");
            log.debug("Progress Check: ", "Zip Code " + zipcode);
            if (zipcode) {
                var geoSearch = tsmSearch(zipcode);
                log.debug("Progress Check: ", "Search Results " + geoSearch);
                if (geoSearch[0]) { //tsm
                    customerRecord.setValue("salesrep", geoSearch[0]);
                    //customerRecord.save();
                }
                if (geoSearch[1]) { //territory
                    customerRecord.setValue("territory", geoSearch[1]);
                    //newRecord.save();
                }
                var saveSuccess = customerRecord.save();
                if (saveSuccess) {
                    if (geoSearch[0]) {
                        updateEmployeeLeadDate(geoSearch[0]);
                    }
                }
            }

        }
    }

    function tsmSearch(zipcode) {
        var currentTSM = "";
        var territoryName = "";
        var customrecord_geolocationSearchObj = search.create({
            type: "customrecord_geolocation",
            filters: [
                ["custrecord_zip", "is", zipcode]
            ],
            columns: [
                "custrecord_zip",
                "custrecord_tsm",
                "custrecord_sss",
                "custrecord_territory"
            ]
        });

        var searchResultCount = customrecord_geolocationSearchObj.runPaged().count;
        customrecord_geolocationSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results

            currentTSM = result.getValue({
                name: "custrecord_tsm"
            });

            territoryName = result.getValue({
                name: "custrecord_territory"
            });

            return false;
        });

        if (currentTSM.split(",").length == 1) {
            //do nothing
        } else {
            currentTSM = pickTSM(currentTSM.split(","));
        }
        return [currentTSM, territoryName];
    }


    function pickTSM(tsmList) {
        var filtersArray = [];
        var pickedTSM = "";

        for (var i = 0; i < tsmList.length; i++) {
            if (i < tsmList.length - 1) {
                filtersArray.push(["internalidnumber", "equalto", tsmList[i]]);
                filtersArray.push("OR");
            } else {
                filtersArray.push(["internalidnumber", "equalto", tsmList[i]]);
            }

        }

        var employeeSearchObj = search.create({
            type: "employee",
            filters: filtersArray,
            columns: [
                search.createColumn({
                    name: "internalid",
                    label: "Internal ID"
                }),
                search.createColumn({
                    name: "custentity_last_lead_added_date",
                    sort: search.Sort.DESC,
                    label: "Last Lead Added Date"
                })
            ]
        });
        var searchResultCount = employeeSearchObj.runPaged().count;
        employeeSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            pickedTSM = result.getValue({
                name: "internalid"
            });
            lastLeadDate = result.getValue({
                name: "custentity_last_lead_added_date"
            });
            if (!lastLeadDate) {
                return false;
            }
            log.debug("picked tsm", pickedTSM);
            return true;
        });
        return pickedTSM;
    }

    function updateEmployeeLeadDate(employeeId) {
        var now = new Date();
        var formattedDate = moment(now).format("MM/DD/YYYY hh:mm:ss A");

        record.submitFields({
            type: 'employee',
            id: employeeId,
            values: {
                'custentity_last_lead_added_date': formattedDate
            }
        });
    }

    return {
        afterSubmit: updateCustomerTSM
    };
});