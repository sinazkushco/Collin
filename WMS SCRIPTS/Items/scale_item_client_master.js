/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

define(['../Libraries/global_modules.js', 'N/url', 'N/runtime'],
    function (global_modules, url, runtime) {
        function page_init_scale_item_master(context) {
            //var currentRecord = context.currentRecord;
            //disable_uom_if_stocked(currentRecord);
        }

        function on_save_scale_item_master(context) {
            var currentRecord = context.currentRecord;
            return global_modules.validate_uom(currentRecord);
        }

        function field_change_scale_item_master(context) {
            var currentRecord = context.currentRecord;
            var fieldId = context.fieldId;
            global_modules.set_ea_weight_if_mc_weight(fieldId, currentRecord);
        }

        function disable_uom_if_stocked(currentRecord) {
            var payload = {
                action: 'check_if_stocked_in_scale_loc',
                current_record_id: currentRecord.id
            }
            var suitelet_url = url.resolveScript({
                scriptId: 'customscript_scale_master_suitelet',
                deploymentId: 'customdeploy_scale_master_suitelet',
                returnExternalURL: true
            });
            jQuery.ajax({
                method: 'POST',
                url: suitelet_url,
                data: payload,
                dataType: 'json'
            }).done(function (response) {
                var stocked_in_wms_location = response.stocked_in_scale_loc
                if (stocked_in_wms_location) {
                    var fields_to_disable = ["custitem_ea_qty", "custitem_ic_qty", "custitem_mc_qty", "stockunit", "purchaseunit", "saleunit"]
                    fields_to_disable.forEach(function (value) {
                        var field = currentRecord.getField({ fieldId: value });
                        field.isDisabled = true;
                    })
                }
            })
        }

        return {
           // pageInit: page_init_scale_item_master,
            fieldChanged: field_change_scale_item_master,
            saveRecord: on_save_scale_item_master
        };
    });


