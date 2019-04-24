/**
 * Script:                  https://system.na2.netsuite.com/app/common/scripting/script.nl?id=455
 * Deployment:  Assmbl Bld  https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=949
 * Deployment:  Assmbl Ubld https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=950
 * Deployment:  Contact     https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=894
 * Deployment:  Customer    https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=810
 * Deployment:  Employee    https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=895
 * Deployment:  Inv Adjust  https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=1036
 * Deployment:  Lead        https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=811
 * Deployment:  Opportunity https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=893
 * Deployment:  Project     https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=896
 * Deployment:  Prospect    https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=812
 * Deployment:  Vendor      https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=1038
 * Deployment:  Work Order  https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=948
 *
 * Purpose: Set the subsidiary field so creation of new records dont throw. Also, QoL for client forms.
 *
 * In NetSuite OneWorld, records need to be under a subsidiary.
 * lots of our implementations, such as ActOn and Shopify, create records on the fly
 * creation of the record fails if no subsidiary is set.
 * by default, subsidiary is not set and must be selected manually.
 *
 */
function set_default_subsidiary_on_create(type){
    if (type == 'create'){
        var sub = nlapiGetFieldValue('subsidiary');
        if (sub === "" || sub === null){
            nlapiSetFieldValue('subsidiary', '1');
        }
    }

    return true;
}