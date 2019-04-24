//will call set entity use code after new address is added to billing or shipping address
//calls customscript_set_entityuse_code
//Collin Wong

function set_entityuse_code_on_add_address(type, fldname) {
    if (window.setting_new_address && (fldname == 'shipaddresslist' ||  fldname == 'billaddresslist')){
        window.set_entityuse_code();
    }
}

