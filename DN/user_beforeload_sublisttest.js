/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(["N/record", "N/ui/serverWidget", "N/search"],

    function (record, serverWidget, search) {
        function beforeLoad(scriptContext) {
            var customerRecord = scriptContext.newRecord;

            var form = scriptContext.form;
            var id = customerRecord.id;
            log.debug("title", id);

            form.addTab({
                id: "custpage_projectitemstab",
                label: "Project Items Tab"
            });

            var sublist = form.addSublist({
                id: "custpage_customsublist8", // my sublist’s id is customsublist12
                type: "list",
                label: "Related Project Items",
                tab: "custpage_projectitemstab"
            });

            sublist.addRefreshButton();

            // var check = sublist.addField({
            //     id : 'custpage_id',
            //     label : 'Check',
            //     type : serverWidget.FieldType.CHECKBOX
            // });
            // check.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
            
            var itm_id = sublist.addField({
                id : 'custpage_item',
                label : 'Item Id',
                type : serverWidget.FieldType.TEXT
                ,
                source: "customrecord_pm_product"
            });

            itm_id.updateDisplayType({displayType: serverWidget.FieldDisplayType.READONLY});
   
   
            var customrecord_pm_productSearchObj = search.create({
                type: "customrecord_pm_product",
                filters:
                [
                    ["custrecord_pm_product_project_id","anyof","916394"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC
                    }),
                    search.createColumn({
                        name: "internalid"
                    })
                ]
            });

            var sublist2 = form.getSublist({
                id : 'custpage_customsublist8'
            });

            var searchResultCount = customrecord_pm_productSearchObj.runPaged().count;
            log.debug("customrecord_pm_productSearchObj result count",searchResultCount);


            var ix = 0;
            customrecord_pm_productSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                sublist2.setSublistValue({
                    id : 'custpage_item',
                    line : ix,
                    // value : result.getValue("name")
                    // value : "https://system.na2.netsuite.com/app/common/custom/custrecordentry.nl?id=" + result.getValue("internalid") + "&rectype=206&whence="
                    //value : result.getValue("internalid")
                    value : "<a href='https://system.na2.netsuite.com/app/common/custom/custrecordentry.nl?id=" + result.getValue("internalid") + "&rectype=206&whence='>" + result.getValue("name") + "</a>"

                });
                ix++;
                return true;
            });
   
    
   
   
   
            // sublist2.setSublistValue({
            //     id : 'custpage_item',
            //     line : 0,
            //     value : "Text"
            // });
   
            // sublist2.setSublistValue({
            //     id : 'custpage_item',
            //     line : 1,
            //     value : "Text"
            // });
   
   
            // sublist2.setSublistValue({
            //     id : 'custpage_item',
            //     line : 2,
            //     value : "Text"
            // });
   
   
               

        }
        return {
            beforeLoad: beforeLoad
        };
    });