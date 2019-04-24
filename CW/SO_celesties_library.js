//***********************************CELERITAS START***********************************************
function getinfo_Celeritas(){
    var Celeritas = {
        SUBSIDIARY: '3',
        LOCATION: '28',
        PO_TYPE: 'DropShip'
    };
    return Celeritas;
}

//sets cart items to be Drop Shipped, if location is Celeritas
function set_PO_type_to_dropship(){
    var Celeritas = getinfo_Celeritas();

    var itemLocation = nlapiGetCurrentLineItemValue('item', 'location');
    if (itemLocation === Celeritas.LOCATION) {
        nlapiSetCurrentLineItemValue('item', 'createpo', Celeritas.PO_TYPE);
    }
}

//sets Celeritas as the default location, if the subsidiary is Celeritas
function set_location_to_celeritas(){
    var Celeritas = getinfo_Celeritas();

    var subsidiary = nlapiGetFieldValue('subsidiary');
    if (subsidiary === Celeritas.SUBSIDIARY) {
        nlapiSetFieldValue('location', Celeritas.LOCATION);
    } //Celeritas  https://system.na2.netsuite.com/app/common/otherlists/locationtype.nl?id=28
}

//***********************************CELERITAS END***********************************************