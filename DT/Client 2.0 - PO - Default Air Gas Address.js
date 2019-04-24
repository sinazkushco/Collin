var SEARCHMODULE;

/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */
define(['N/search', 'N/runtime', 'N/record'], runClientscript);

function runClientscript(search, runtime, record){
    SEARCHMODULE = search;

    //List of all Billing Addresses for Airgas.  billaddresslist for the airgas vendor entity https://system.na2.netsuite.com/app/common/entity/vendor.nl?id=827153
    var Airgas = {
        COLORADO:           2269373 //default
        , LASVEGAS:         2283084
        , PHOENIX:          2283083
        , SANTAFESPRINGS:   2283082
        , SYLMAR:           2269484
    };

    //List of locations by internalid.  the key DEFAULT represents the default AIRGAS billaddress
    var Locations = {
        20: {
            Name: "Ft Lupton, CO"
            , DEFAULT: "COLORADO"
        }
        , 22: {
            Name: "Las Vegas, NV"
            , DEFAULT: "LASVEGAS"
        }
        , 15: {
            Name: "Phoenix, AZ"
            , DEFAULT: "PHOENIX"
        }
        , 18: {
            Name: "Riverside, CA"
            , DEFAULT: "SANTAFESPRINGS"
        }
    };

    //*********** HELPER FUNCTIONS ***********
    function postSourcing(context) {
        var fieldName = context.fieldId;

        if (fieldName === 'location'){
            debugger;
            var rec = context.currentRecord;

            var ID = rec.getValue({fieldId: fieldName});
            if (Locations[ID] !== undefined){
                rec.setValue({
                    fieldId:    'billaddresslist',
                    value:      Airgas[Locations[ID].DEFAULT]
                })
            } else {
                //location does not have a default set
            }
        }

        return;
    }

    var returnObj = {};
    returnObj.postSourcing = postSourcing;
    return returnObj;
}