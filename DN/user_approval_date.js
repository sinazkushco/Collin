var SEARCH, RECORD, MOMENT;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define(["N/search", "N/record", "../Library/moment.js"], runUserEvent);

function runUserEvent(search, record, moment) {
    SEARCH = search;
    RECORD = record;
    MOMENT = moment;

    var returnObj = {};
    returnObj.afterSubmit = afterSubmit;
    return returnObj;
}

function afterSubmit(context) {

    try {
        var type = context.type;

        if (type != "edit" && type != "approve" && type != "create" && type != "xedit") {
            return;
        }
        var approvalDateSet = context.newRecord.getValue("custbody_approval_date");
        var currentShipDate = context.newRecord.getValue("shipdate");
        var soInternalId = context.newRecord.id;

        if (type == "create" && approvalDateSet) { // this conditional is for people who use the "make copy" function of a record.
            setApprovalDate(soInternalId, currentShipDate);
        } else if ((type == "edit" || type == "create" || type == "xedit") && !approvalDateSet && soInternalId) {
            setApprovalDate(soInternalId, currentShipDate);
        } else if (type == "approve") { // this conditional is for people who hit that blue approve button
            setApprovalDate(soInternalId, currentShipDate);
        }

        return;

    } catch (error) {
        log.debug("Error", error);
    }

}

function setApprovalDate(soInternalId, currentShipDate) {
    log.debug("set approval date function ran");
    var approvalDate = "";
    var transactionSearchObj = SEARCH.create({
        type: "transaction",
        filters: [
            ["systemnotes.field", "anyof", "TRANDOC.KSTATUS"],
            "AND", ["internalidnumber", "equalto", soInternalId],
            "AND", ["systemnotes.oldvalue", "is", "Pending Approval"],
            "AND", ["systemnotes.newvalue", "is", "Pending Fulfillment"],
            "AND", ["mainline", "is", "T"]
            // ,
            // "AND",
            // ["systemnotes.date","within","today"]
        ],
        columns: [
            "internalid",
            SEARCH.createColumn({
                name: "oldvalue",
                join: "systemNotes"
            }),
            SEARCH.createColumn({
                name: "newvalue",
                join: "systemNotes"
            }),
            SEARCH.createColumn({
                name: "type",
                join: "systemNotes"
            }),
            SEARCH.createColumn({
                name: "name",
                join: "systemNotes"
            }),
            SEARCH.createColumn({
                name: "context",
                join: "systemNotes"
            }),
            SEARCH.createColumn({
                name: "date",
                join: "systemNotes",
                sort: SEARCH.Sort.ASC
            })
        ]
    });
    var searchResultCount = transactionSearchObj.runPaged().count;

    if (searchResultCount > 0) {
        transactionSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            approvalDate = result.getValue({
                name: "date",
                join: "systemNotes"
            });
            return false;
        });
    }

    if (approvalDate) {

        var dateTime = approvalDate.slice(0, approvalDate.length - 3) + ":00 ";
        var amPm = approvalDate.slice(approvalDate.length - 2, approvalDate.length);
        approvalDate = dateTime + amPm;
        var datePlusOne = MOMENT(approvalDate.split(" ")[0], "MM/DD/YYYY").add(1, "days").format('MM/DD/YYYY');
        var dayOfWeek = MOMENT(datePlusOne).day();
        var jsDayObj = MOMENT(datePlusOne, "MM/DD/YYYY").toDate();

        // Prevents ship days on weekends
        while (dayOfWeek == "6" || dayOfWeek == "0" || check_holiday(jsDayObj)) {
            datePlusOne = MOMENT(datePlusOne, "MM/DD/YYYY").add(1, "days").format('MM/DD/YYYY');
            dayOfWeek = MOMENT(datePlusOne).day();
            jsDayObj = MOMENT(datePlusOne, "MM/DD/YYYY").toDate();
        }

        // New ship date is after current ship date
        if (MOMENT(datePlusOne).isAfter(currentShipDate)) {
            RECORD.submitFields({
                type: "salesorder",
                id: soInternalId,
                values: {
                    "custbody_approval_date": approvalDate,
                    "shipdate": datePlusOne
                }
            });
        } else {
            RECORD.submitFields({
                type: "salesorder",
                id: soInternalId,
                values: {
                    "custbody_approval_date": approvalDate
                }
            });
        }

    }

}

function check_holiday(dt_date) { // check for market holidays
    // dt_date = new Date("2017-04-14T12:01:00Z"); // for testing purposes
    // check simple dates (month/date - no leading zeroes)
    var n_date = dt_date.getDate();
    var n_month = dt_date.getMonth() + 1;
    var s_date1 = n_month + '/' + n_date;
    // var s_year = dt_date.getFullYear();
    var s_day = dt_date.getDay(); // day of the week 0-6
    switch (s_date1) {
        case '1/1':
            return "New Year's";
        case '7/4':
            return "Independence Day";
        case '12/25':
            return "Christmas";
            // case GoodFriday(s_year):
            //     return "Good Friday";
    }
    // special cases - friday before or monday after weekend holiday
    if (s_day == 5) { // Friday before
        switch (s_date1) {
            //case '12/31':
                //return "New Year's";
            case '7/3':
                return "Independence Day";
            case '12/24':
                return "Christmas";
        }
    }
    if (s_day == 1) { // Monday after
        switch (s_date1) {
            case '1/2':
                return "New Year's";
            case '7/5':
                return "Independence Day";
            case '12/26':
                return "Christmas";
        }
    }
    // weekday from beginning of the month (month/num/day)
    var n_wday = dt_date.getDay();
    var n_wnum = Math.floor((n_date - 1) / 7) + 1;
    var s_date2 = n_month + '/' + n_wnum + '/' + n_wday;
    switch (s_date2) {
        // case '1/3/1':
        //     return "ML King Birthday";
        // case '2/3/1':
        //     return "President's Day";
        case '9/1/1':
            return "Labor Day";
        case '11/4/4':
            return "Thanksgiving";
        case '11/4/5':
            return "Day After Thanksgiving";
    }
    // weekday number from end of the month (month/num/day)
    var dt_temp = new Date(dt_date);
    dt_temp.setDate(1);
    dt_temp.setMonth(dt_temp.getMonth() + 1);
    dt_temp.setDate(dt_temp.getDate() - 1);
    n_wnum = Math.floor((dt_temp.getDate() - n_date - 1) / 7) + 1;
    var s_date3 = n_month + '/' + n_wnum + '/' + n_wday;
    if (s_date3 == '5/1/1' // Memorial Day, last Monday in May
    ) return 'Memorial Day';
    // misc complex dates
    //	if (s_date1 == '1/20' && (((dt_date.getFullYear() - 1937) % 4) == 0) 
    // Inauguration Day, January 20th every four years, starting in 1937. 
    //	) return 'Inauguration Day';
    //	if (n_month == 11 && n_date >= 2 && n_date < 9 && n_wday == 2
    // Election Day, Tuesday on or after November 2. 
    //	) return 'Election Day';
    return false;
}
// function GoodFriday(Y) {  // calculates Easter Sunday and subtracts 2 days
//     var C = Math.floor(Y/100);
//     var N = Y - 19*Math.floor(Y/19);
//     var K = Math.floor((C - 17)/25);
//     var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
//     I = I - 30*Math.floor((I/30));
//     I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
//     var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
//     J = J - 7*Math.floor(J/7);
//     var L = I - J;
//     var M = 3 + Math.floor((L + 40)/44);
//     var D = L + 28 - 31*Math.floor(M/4);
//     //
//     D = D-2;  // subtract 2 days for Good Friday
//     if (D <= 0){
//         D = D + 31;	// correct day if we went back to March
//         M = 3;			// correct month
//     }
//     return parseInt(M, 10) + '/' + parseInt(D, 10);  // return without any leading zeros
// }