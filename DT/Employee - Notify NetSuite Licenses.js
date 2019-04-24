/**
 * @NAPIVersion 2.0
 * @NScriptType UserEventScript
 */
define(["require", "exports", "N/log", "N/search", "N/email"], function (require, exports, log, search, email) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.afterSubmit = function (context) {
        /* ****************** GLOBAL VARIABLES ************************* */
        var MAX_LICENSES, LICENSES_IN_USE, output, emp_had_access, emp_has_access, type_is_create;
        /* ****************** CONFIGURE SETTINGS HERE ************************* */
        var Settings = {
            THRESHOLD: 3,
            REORDER_MESSAGE: function (Licenses) { return "We only have " + (Licenses.MAX - Licenses.CURRENT) + " NetSuite licenses remaining! NetSuite Licenses in use: " + Licenses.CURRENT + "/" + Licenses.MAX + "."; },
            IN_USE: function (Licenses) { return "NetSuite Licenses in use: " + Licenses.CURRENT + "/" + Licenses.MAX + "."; },
            EMAIL: function (Licenses) {
                return {
                    author: 358183,
                    recipients: ['dev@kushbottles.com'],
                    subject: "Notification: Only " + (Licenses.MAX - Licenses.CURRENT) + " NetSuite Licenses remaining! (" + Licenses.CURRENT + "/" + Licenses.MAX + ")",
                    body: "Please reorder more, then update our <a href=\"https://system.na2.netsuite.com/app/common/custom/custrecordentry.nl?rectype=148&id=2\">Provisioned Licenses tracker</a>."
                };
            }
        };
        /* ****************** LOGIC ************************* */
        type_is_create = context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY;
        emp_had_access = type_is_create ? null : context.oldRecord.getValue('giveaccess');
        emp_has_access = context.newRecord.getValue('giveaccess');
        if ((type_is_create && emp_has_access)
            || (!type_is_create && emp_has_access && !emp_had_access)) {
            // log.debug("New License provisioned!", {emp_had_access, emp_has_access})
            LICENSES_IN_USE = getLicensesInUse();
            MAX_LICENSES = getMaxLicenses();
            output = { MAX: MAX_LICENSES, CURRENT: LICENSES_IN_USE };
            var reorder_point_reached = LICENSES_IN_USE >= MAX_LICENSES - Settings.THRESHOLD;
            if (reorder_point_reached) {
                log.audit('REORDER POINT REACHED', Settings.REORDER_MESSAGE(output));
                // if (runtime.executionContext === runtime.ContextType.USER_INTERFACE){
                email.send(Settings.EMAIL(output));
                // }
            }
            else {
                log.audit('Licenses still available', Settings.IN_USE(output));
            }
        }
        // log.debug("Employee record changed, but license was not provisioned.",{emp_had_access, emp_has_access});
        /* ****************** FUNCTIONS ************************* */
        /**
         * Get the number of NetSuite licenses currently in use
         * @returns {number}
         */
        function getLicensesInUse() {
            var loadedSearch = search.load({ id: '1283' });
            var resultSet = loadedSearch.run();
            var results = resultSet.getRange({ start: 0, end: 1 });
            var result = results[0];
            return +result.getValue({ name: 'entityid', summary: search.Summary.COUNT });
        }
        /**
         * Get the number of NetSuite licenses allowed on our service.  Self-reported value
         * @returns {number}
         */
        function getMaxLicenses() {
            var FIELDNAME = 'custrecord_increment';
            var OPTIONS = { type: 'customrecord_autoincrement', id: '2', columns: [FIELDNAME] };
            var lookup = search.lookupFields(OPTIONS);
            return +lookup[FIELDNAME];
        }
    };
});
