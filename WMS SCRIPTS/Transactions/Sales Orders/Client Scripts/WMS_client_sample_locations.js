/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 */

define(['../../../../UOM Base Unit/UOM_base_unit.js'], function (uomBaseUnit) {
    function setUOMToBaseUnit(context) {
        if (context.currentRecord.getValue('customform') == '169') {
            if (context.sublistId === 'item' && context.fieldId === 'item') {
                var unitTypeId = context.currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_units_type'
                })
                var uomBaseUnitMap = uomBaseUnit.uomJson

                // Update Internal Id of units
                context.currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'units',
                    value: uomBaseUnitMap[unitTypeId] || '',
                    ignoreFieldChange: true
                });

                // Update UI view of units
                context.currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'units_display',
                    value: 1,
                    ignoreFieldChange: true
                });
            }
        }
        return true;
    }

    function setPriceToZero(context) {
        var sublistId = context.sublistId,
            fieldId = context.fieldId;

        if (
            context.currentRecord.getValue('customform') === '169' 
            && sublistId === 'item'
            && fieldId === 'rate'
        ) {
            var price = Number(context.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate'
            }));

            context.currentRecord.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'price_display', // This field is Price Level
                value: 'Custom'
            });

            if(price != 0) {
                context.currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: 0
                });   
            }
        }
        return true;
    }

    function setItemLocationToSampleLocation(context) {
        if (context.currentRecord.getValue('customform') === '169' && (context.fieldId === 'custcol_sample_location' || (context.sublistId === 'item' && context.fieldId === 'location'))) {
            var sampleLocation = context.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_sample_location',
            });

            var location = context.currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'location',
            });

            if (sampleLocation !== location) {
                context.currentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    value: sampleLocation
                });
                // log.audit('SetItemLocationToSampleLocation', context.currnetRecord.id)
            }
        }

        return true;
    }

    function setLocationToSampleLocation(context) {
        var formType = Number(context.currentRecord.getValue('customform'));
        if (formType === 169) { // KB Sample Sales Order
            var sampleLocation = context.currentRecord.getValue('custbody_sample_location');
            context.currentRecord.setValue({
                fieldId: 'location',
                value: sampleLocation
            });
        }
        return true
    }

    function checkSampleOrderBox(context) {
        var formType = Number(context.currentRecord.getValue('customform'));

        if (formType === 169) { // KB Sample Sales Order
            context.currentRecord.setValue({
                fieldId: 'custbody_sample_order',
                value: true
            });
        }

        return true;
    }

    function disableLineField(context, fieldId) {
        var formType = Number(context.currentRecord.getValue('customform'));

        if (formType === 169) {
            try {
                var currentRecord = context.currentRecord,
                    lines = currentRecord.getLineCount({ sublistId :'item' }),
                    line = currentRecord.getCurrentSublistIndex({
                        sublistId: context.sublistId
                    });

                if((line + 1)  > lines) return;

                currentRecord.getSublistField({
                    sublistId: 'item',
                    fieldId: fieldId,
                    line: line
                }).isDisabled = true;
            } catch (e) {
                // Do nothing, this is needed because getSublistField is not available when on a new line.
                // console.log('catch', e);
            }
        }
    }

    return {
        setUOMToBaseUnit: setUOMToBaseUnit,
        setItemLocationToSampleLocation: setItemLocationToSampleLocation,
        setLocationToSampleLocation: setLocationToSampleLocation,
        setPriceToZero: setPriceToZero,
        checkSampleOrderBox: checkSampleOrderBox,
        disableLineField: disableLineField
    }
});