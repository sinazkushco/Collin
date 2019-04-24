//client side script to hide hazmat field from UI

function pageInit(type) {
    
    if(jQuery("#custitem_hazmat_item_fs_lbl_uir_label").length > 0) {
        jQuery("#custitem_hazmat_item_fs_lbl_uir_label").parent().hide();
    }

}