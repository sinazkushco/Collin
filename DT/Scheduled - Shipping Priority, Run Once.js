//the scheduled script below clashed with my userevent script so this just loads/saves a record to let the userevent run
function fixOther(type){
    var search = nlapiLoadSearch('transaction','customsearch_shippriority_other'); //1929
    var resultSet = search.runSearch();
    var results = resultSet.getResults(0,1000);
    var success = 0, fail = 0;

    nlapiLogExecution('AUDIT', 'STARTING', results.length);
    nlapiLogExecution('AUDIT', 'search '+typeof search, search);
    nlapiLogExecution('AUDIT', 'resultSet '+typeof resultSet, resultSet);
    nlapiLogExecution('AUDIT', 'results '+typeof results, results);
    nlapiLogExecution('AUDIT', 'result0 '+typeof results[0], results[0]);

    for (var row = 0; row < results.length; row++) {
        var result = results[row];
        var id = result.getValue('internalid', null, 'GROUP');
        var rec = nlapiLoadRecord('salesorder', id);
        try{
            nlapiSubmitRecord(rec);
            success++;
            nlapiLogExecution('DEBUG',success +"/"+ results.length +" | salesorder:"+ id, success);
            window && window.console && window.console.log(success +"/"+ results.length +" | salesorder:"+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
        } catch (error){
            fail++;
            nlapiLogExecution('ERROR',fail +"/"+ row +" | salesorder:"+ id, error);
            window && window.console && window.console.error(fail +"/"+ row +" | salesorder:"+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping', error);
        }
    }

    nlapiLogExecution('AUDIT', 'Finished', success +" pass, "+ fail +" failed.");
}

function scheduled (type){
    /*
     * LOOKUP TABLES - A static map, and also serves as a dynamic lookup that will be built out
     * */
    var ShippingItems = new ShippingItemLookupTables();

    /*
     * SETUP - Get Input Data
     * */
    var Search = nlapiLoadSearch('transaction','customsearch_shipping_priority_script');
    var ResultSet = Search.runSearch();
    var results = ResultSet.getResults(0,1000);

    window && window.console && window.console.warn(results.length);
    nlapiLogExecution('AUDIT', 'STARTING', results.length);
    var success = 0, fail = 0;

    /*
     * LOGIC - Do stuff
     * */
    for (var row = 0; row < results.length; row++) {
        var result = results[row];
        var id = result.getValue('internalid', null, 'GROUP');

        //have to use loadrecord because you cant nlapiSubmitField select fields in 1.0 or 2.0
        var rec = nlapiLoadRecord('salesorder', id);
        var shipmethod = rec.getFieldValue('shipmethod');
        var oldpriority = rec.getFieldValue('custbody_shipping_priority');

        if (shipmethod === null) {
            window && window.console && window.console.error("No Shipping Method set" +' | salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
            nlapiLogExecution('ERROR', "No Shipping Method set", 'salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
            fail++;
        } else {
            var description = ShippingItems.getDescription(shipmethod);
            var shipping_priority = ShippingItems.PRIORITY_MAP[description] || "6";
            rec.setFieldValue('custbody_shipping_priority', shipping_priority);

            try {
                nlapiSubmitRecord(rec);
                var newpriority = nlapiLookupField('salesorder', id, 'custbody_shipping_priority');
                if (newpriority == 6) {
                    window && window.console && window.console.warn(oldpriority + ' -> ' + description +' | salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
                    nlapiLogExecution('AUDIT', oldpriority + ' -> ' + description, 'salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
                }
                else {
                    window && window.console && window.console.log(oldpriority + ' -> ' + description +' | salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
                    nlapiLogExecution('DEBUG', oldpriority + ' -> ' + description, 'salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping');
                }
                success++;
            } catch(error) {
                window && window.console && window.console.error('salesorder:'+ id +' | https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+ id +'&whence=&selectedtab=shipping', error);
                nlapiLogExecution('AUDIT', 'salesorder:'+ id, error);
                fail++;
            }

        }
    }

    window && window.console && window.console.warn("Finished. "+ success +" pass, "+ fail +" failed.");
    nlapiLogExecution('ERROR', 'Finished', success +" pass, "+ fail +" failed.");


    function ShippingItemLookupTables(){
        this.PRIORITY_MAP = {
            EXPEDITED:      '1',
            GROUND:         '2',
            FREIGHT:        '3',
            "WILL CALL":    '4',
            DELIVERY:       '5',
            OTHER:          '6'
        };
        //if first time calling for a shipmethod, lookup value in netsuite. then store value to use for future calls.
        this.getDescription = function(shipmethod){
            //check if we've already looked this up before
            var DESCRIPTION = this[shipmethod];
            if (!DESCRIPTION){
                //we havent looked up this shipitem before. need to query NetSuite
                try {
                    var description = nlapiLookupField('shipitem', shipmethod, 'description') || '';
                    DESCRIPTION = description.toUpperCase();
                } catch (error) {
                    nlapiLogExecution('ERROR', 'Failed to nlapiLookupField("shipitem", ' + shipmethod + ', "description")', error);
                }
                //failsafe: checks for empty values or bad values such as description being 'BIG FAT CAT'
                if (!this.PRIORITY_MAP[DESCRIPTION]){
                    DESCRIPTION = 'OTHER';
                }
                //set this shipitem so we dont have to look it up again
                this[shipmethod] = DESCRIPTION;
            }
            return DESCRIPTION;
        };
        return this;
    }
}