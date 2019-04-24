//script that shows a license dom if customer has a license

var licenseTypes = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), "custentity_license_type");

if(licenseTypes) {
    jQuery("#license").show();
}