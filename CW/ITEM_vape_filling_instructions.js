function confirm_vape_filling_instructions(exec) {
    if (exec == 'userinterface') {
        try {
            if (window.debugit === true) { debugger; }

                var record_type = nlapiGetRecordType();
                if (record_type === 'inventoryitem') {
                    var item_class = nlapiGetFieldValue('class');
                    var vape_filling_instructions = nlapiGetFieldValue('custitem_vape_filling_instructions');
                    if (item_class == '57' && !vape_filling_instructions) {
                        if (typeof confirm === 'function') {
                            var yes = confirm("You are creating a Vape Product without selecting a Filling Instruction card.  Do you wish to proceed?");
                            if (yes) {
                                return true;
                            } else {
                                find_element_on_form('custitem_vape_filling_instructions');
                                return false;
                            }
                        }
                    }
                }
        } catch(error){
            nlapiLogExecution('ERROR','Error thrown and caught',error);
            return true;
        }
    }

    return true;
}

function find_element_on_form(internalid) {
    if (window.jQuery) {
        var $element = jQuery('[title="' + internalid + '"]');
        if ($element) {
            //var id = 'custitem_vape_filling_instructions';
            //console.log($element.length);
            //console.log($element.is(':visible'));
            if ($element.length) {
                if ($element.is(':visible')) {
                    // scroll into view
                    //console.log('Field on page',$element.position());
                } else {
                    // find it
                    //console.log("Field found but we can't see it");
                    var tabWrapperId = $element.parents('.nltabcontent[id$="_wrapper"]')
                        .last()
                        .attr('id');
                    // click the text corresponding to the wrapper id
                    var tabId = tabWrapperId.substr(0, tabWrapperId.indexOf('_wrapper'));
                    var txtId = tabId + 'txt';
                    var expandedTabsId = tabId + '_pane_hd';
                    //console.log('text id: '+txtId);
                    //console.log('exp tab id: '+expandedTabsId);
                    if (document.getElementById(txtId)) {
                        document.getElementById(txtId)
                            .click();
                    } else if (document.getElementById(expandedTabsId)) {
                        document.getElementById(expandedTabsId)
                            .click();
                    }
                    //console.log('Field on page',$element.position());
                }
                $element.css({
                    'border': '1px solid red',
                    'background-color': 'yellow'
                });
                var pos = $element.offset();
                var top = pos.top - 150;
                var left = pos.left - 20;
                window.scrollTo((left < 0 ? 0 : left), (top < 0 ? 0 : top));
                $element.mouseenter(
                    function (e) {
                        //console.log('remove style on mouseenter, then delete eventlistener');
                        jQuery(this)
                            .css({
                                'border': 'none',
                                'background-color': ''
                            });
                        jQuery(this)
                            .unbind('mouseenter');
                    });
                return true;
            } // $element.length
        } // $element
    } // window.jQuery
    return false;
}