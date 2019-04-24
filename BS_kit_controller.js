var o = {
    lineCount: -1,
    kit: {},
    workingOnList: false,
    // duplicateLines: [],
    // kitItem: {},
    // kitItems: [],
    // kitMember: {},
    // taxCode: '',
    // kitQuantity: -1,
    mainBundle: function() {
      debugger;
      if (o.workingOnList) return;
        try {
            o.setLineCount();
            var loop = 1;
            var loopTimes = o.lineCount;
            for (; loop <= loopTimes;) {
                itemType = nlapiGetLineItemValue('item', 'itemtype', loopTimes);
                if (itemType === 'Kit') {
                    o.kit.itemId = nlapiGetLineItemValue('item', 'item', loop);
                    o.kit.itemMembers = nlapiLoadRecord('kititem', o.kit.itemId).lineitems.member;
                    o.kit.quantity = nlapiGetLineItemValue('item', 'quantity', loop);
                    o.kit.taxcode = nlapiGetLineItemValue('item', 'taxcode', loop);
                    loopKidTimes = o.kit.itemMembers.length;
                    loopKid = 1;
                    for (; loopKid < loopKidTimes;) {
                        o.workingOnList = true;
                        //nlapiSelectLineItem('item', o.lineCount + loopKid);
                        nlapiSelectNewLineItem('item');
                        nlapiSetCurrentLineItemValue('item', 'item', o.kit.itemMembers[loopKid].item, true, true);
                        nlapiSetCurrentLineItemValue('item', 'quantity', o.kit.quantity, true, true);
                        nlapiSetCurrentLineItemValue('item', 'description', o.kit.taxcode, true, true);
                        nlapiCommitLineItem('item');
                        loopKid++;
                    }
                    o.workingOnList = false;
                    nlapiRemoveLineItem('item', loopTimes);
                    o.setLineCount();
                }
                loopTimes--;
            }
        } catch (err) {
           o.workingOnList = false;
            alert("For someresean I can't exchange kit to kit's members");
        }
    },
    setLineCount: function() {
        o.lineCount = nlapiGetLineItemCount('item');
    },
    // bundlePoint: function() {
    //     try {
    //         if (o.workingOnList === false) {
    //             o.setLineCount();
    //             o.searchForKit();
    //             o.workingOnList = true
    //             o.startToExchangeKitToMembers();
    //             // o.insertKitMember();
    //             o.workingOnList = false;
    //         }
    //     } catch (err) {
    //         o.workingOnList = false;
    //     }
    // },
    // searchForKit: function() {
    //     var loop = 1;
    //     var itemType = -1;
    //     o.kitItems = []
    //     for (; loop <= o.lineCount;) {
    //         itemType = nlapiGetLineItemValue('item', 'itemtype', loop);
    //         if (itemType === 'Kit') {
    //             o.kitItem.item = nlapiGetLineItemValue('item', 'item', loop);
    //             o.kitItem.quantity = nlapiGetLineItemValue('item', 'quantity', loop);
    //             o.kitItem.taxcode = nlapiGetLineItemValue('item', 'taxcode', loop);
    //             o.kitItem.index = loop;
    //             o.kitItems.push(o.kitItem);
    //             o.kitItem = {};
    //         }
    //         loop++;
    //     }
    // },
    // startToExchangeKitToMembers: function() {

    //     var loopTimes = o.kitItems.length - 1;
    //     var loop = 0;
    //     for (; loop <= loopTimes;) {
    //         o.setKitMember(o.kitItems[loopTimes].item,
    //             o.kitItems[loopTimes].quantity,
    //             o.kitItems[loopTimes].taxcode);
    //         if (o.insertKitMember()) {
    //             o.deleteKitItem(loopTimes + 1);
    //         }
    //         loopTimes--;
    //     }
    //     o.clearVariable();
    // },
    // clearVariable: function() {
    //     o.lineCount = -1;
    //     o.duplicateLines = [];
    //     o.kitItem = {};
    //     o.kitItems = [];
    //     o.kitMember = {};
    //     o.kit = [];
    //     o.taxCode = '';
    //     o.kitQuantity = -1;
    // },
    // deleteKitItem: function(index) {
    //     nlapiRemoveLineItem('item', o.kitItems[index].index);
    //     o.kitItems[index].splice(index, 1);
    // },
    // insertKitMember: function() {
    //     try {
    //         debugger;
    //         nlapiSelectLineItem('item', o.lineCount + 1);
    //         nlapiSetCurrentLineItemValue('item', 'item', o.kit, true);
    //         nlapiSetCurrentLineItemValue('item', 'quantity', o.kitQuantity, true);
    //         nlapiSetCurrentLineItemValue('item', 'description', o.taxCode, true);
    //         nlapiCommitLineItem('item');
    //         return true;
    //     } catch (err) {
    //         return false;
    //     }
    // },
    // setKitMember: function(itemId, quantity, taxcode) {
    //     o.kit = itemId;
    //     o.kitQuantity = quantity;
    //     o.taxCode = taxcode;
    // }
};


// document.getElementById('btn_secondarymultibutton_submitter').addEventListener('click', o.bundlePoint());