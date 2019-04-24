/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */

define([
    'N/file'
], function (file) {
    function afterSubmit(context) {
        var unitTypeId = context.newRecord.id;
        var lines = context.newRecord.getLineCount('uom');
        var UOM_base_unitJSONFileId = 1875797;
        var UOMBaseUnitFolderId = 1253848;
        var baseUnitId = 6; // using 6 as a default since this is the current internal id for boxes, which is the most common unit type.

        for (var line = 0; line < lines; line++) {
            var isBaseUnit = context.newRecord.getSublistValue({
                sublistId: 'uom',
                fieldId: 'baseunit',
                line: line
            })
            if (isBaseUnit) {
                baseUnitId = context.newRecord.getSublistValue({
                    sublistId: 'uom',
                    fieldId: 'internalid',
                    line: line
                });
            }
        }
        try {
            var uomJSON = JSON.parse(file.load({ id: UOM_base_unitJSONFileId }).getContents()); // Internal Id for UOM_base_unit.json
            uomJSON[unitTypeId] = baseUnitId;
            uomJSON = JSON.stringify(uomJSON, null, 4);

            var javascriptTemplate = '// Updated on: ' + new Date().toLocaleDateString() + '\n' +
            'define([], function() { \n' +
            '   return { \n' +
            '       uomJson: ' + uomJSON + '\n' +
            '   }\n' +
            '})'

            file.create({
                name: 'UOM_base_unit.json',
                folder: UOMBaseUnitFolderId, // Id for the UOM Base Unit folder
                fileType: file.Type.JSON,
                contents: uomJSON,
            }).save();

            file.create({
                name: 'UOM_base_unit.js',
                folder: UOMBaseUnitFolderId, // Id for the WMS sales orders client scripts folder
                fileType: file.Type.JAVASCRIPT,
                contents: javascriptTemplate,
            }).save();
            log.debug('Saved UOM', uomJSON)
        } catch (error) {
            if (error.name === 'RCRD_DSNT_EXIST') {
                var uomJSON = {};
                uomJSON[unitTypeId] = baseUnitId;

                file.create({
                    name: 'UOM_base_unit.json',
                    folder: UOMBaseUnitFolderId, // Id for the UOM Base Unit folder
                    fileType: file.Type.JSON,
                    contents: JSON.stringify(uomJSON),
                }).save();

            } else {
                log.error('There was an error with the JSON record', error);
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
})
