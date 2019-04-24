//Published by Matt Barnett

//Transfer Order Form : on page source, set default shipping method to Freight/Other
// code 4774


function setDefaultShippingMethod(){
    nlapiSetFieldValue("shipmethod", "4774") // set default shipping method to Freight Other
}

function disableUnitsField(sublistId, fieldId) {
    if (sublistId === 'item') {
        if (fieldId && fieldId === 'item') {
            //for postsourcing
            nlapiSetLineItemDisabled('item', 'units', true);
        } else {
            //for lineinit
            nlapiSetLineItemDisabled('item', 'units', true);
        }
    }
}