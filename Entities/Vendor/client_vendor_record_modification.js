/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType ClientScript
 */

define([], function () {
    function titleCaseManufacturerCity(context) {
        if(context.fieldId === 'custentity_mfc_city') {
            var currentRecord = context.currentRecord,
                city = currentRecord.getValue('custentity_mfc_city');

            if(city === _toTitleCase(city)) return;

            currentRecord.setValue('custentity_mfc_city', _toTitleCase(city));
        }
    }

    function requireManufacturingCity(context) {
        var currentRecord = context.currentRecord,
            city = currentRecord.getValue('custentity_mfc_city'),
            country = currentRecord.getValue('custentity_mfc_country');

        if(city && !country) {
            alert('Please select a Manufacturing Country if Manufacturing City is specified.');
            return false;
        }
        return true;
    }

    function _toTitleCase(string){
        return string.toLowerCase().split(' ').map(function(word){
            if(!/[a-zA-Z]/.test(word)) return word; // If not an alphabetical character, return the same value.
            return word.replace(word[0], word[0].toUpperCase());
        }).join(' ');
    }

    return {
        fieldChanged: titleCaseManufacturerCity,
        saveRecord: requireManufacturingCity
    }
});
