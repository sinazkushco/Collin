/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 *
 */

/*
 * 
 * Updates Fields with Correct URL
 * 
 */

define(["N/record", "N/file"],
    function (record, file) {

        function each(params) {


            try {

                var itemRecord = record.load({
                    type: params.type,
                    id: params.id
                });

                var itemUrlLineCount = itemRecord.getLineCount("itemimages");

                if (itemUrlLineCount > 0) {
                    var topImageId = itemRecord.getSublistValue({
                        sublistId: "itemimages",
                        fieldId: "nkey",
                        line: 0
                    });

                    var fileObj = file.load({
                        id: topImageId
                    });

                    var fileName = fileObj.name;
                    var URL = "https://www.kushsupplyco.com/Images/items/" + fileName;
                    if (fileName) {
                        record.submitFields({
                            type: params.type,
                            id: params.id,
                            values: {
                                custitem_wms_image_url: URL
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields : true
                            }
                        });
                        
                    }
                }

            } catch (e) {
                //
            }
        }

        return {
            each: each
        };
    }
);