// 2.0 - Fluent
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @appliedtorecord salesorders
 */
define(["N/record", "N/log", "N/search", "N/runtime", "../Library/moment"], function (record, log, search, runtime, moment) {
    function updateCustomerTSM(context) {

        log.debug("Progress Check: ", "Function is being called");
        log.debug("Context Check", runtime.executionContext + " " + runtime.ContextType.WEBSTORE);

        if (runtime.executionContext === runtime.ContextType.WEBSTORE) {
            var newRecord = context.newRecord;
            var customerId = newRecord.getValue("entity");

            //record is loaded for BILLZIP
            var customerRecord = record.load({
                type: "customer",
                id: customerId,
                isDynamic: false,
                defaultValues: null
            });

            var currentSalesRep = customerRecord.getValue("salesrep");
            var zipcode = customerRecord.getValue("billzip");
            if (currentSalesRep == "519") { //id for house account
                var tsm = tsmSearch();
                if (tsm) {
                    customerRecord.setValue("salesrep", tsm);
                    var saveSuccess = customerRecord.save();
                    if (saveSuccess) {
                        updateEmployeeLeadDate(tsm);
                    }
                }
            }

        }
    }

    function tsmSearch() {
        var currentTSM = "";
        var customrecord_geolocationSearchObj = search.create({
            type: "customrecord_geolocation",
            filters: [
                ["custrecord_zip", "is", zipcode]
            ],
            columns: [
                "custrecord_zip",
                "custrecord_tsm",
                "custrecord_sss"
            ]
        });

        var searchResultCount = customrecord_geolocationSearchObj.runPaged().count;
        customrecord_geolocationSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results

            currentTSM = result.getValue({
                name: "custrecord_tsm"
            });

        });

        if (currentTSM.split(",").length == 1) {
            return currentTSM;
        } else {
            currentTSM = pickTSM(currentTSM.split(","));
        }
        return currentTSM;
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