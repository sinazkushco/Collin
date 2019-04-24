/** fires when the submit button is pressed, but prior to form being submitted
 * @return  boolean     false to prevent submission
 * */
function saveRecord_minQuantityCheck() {
  //load transaction to loop through
  try { //when you are afraid you're gonna break something
      var context = nlapiGetContext().getExecutionContext();
      var project = nlapiGetFieldValue("job");
      if (context == "userinterface" && project) {

          var itemCount = nlapiGetLineItemCount("item");
          var tempArray = [];
          var minQuantityObj = {};
          var minQuantityAmount = {};

          if (itemCount) {
              for (var i = 1; i < itemCount + 1; i++) {
                  var itemId = nlapiGetLineItemValue("item", "item", i);
                  var itemText = nlapiGetLineItemText("item", "item", i);
                  var itemQuantity = parseInt(nlapiGetLineItemValue("item", "quantity", i));
                  var itemParentText = nlapiLookupField('item', itemId, "parent", true);

                  if (itemParentText != null && itemParentText != undefined && itemParentText != "") {
                      if (itemParentText.indexOf("BRANDED") == 0) { //TODO: COULD BE IMPROVED - DRILL IN MORE AND GET PARENT OF THIS ITEM TOO
                          if (!minQuantityObj[itemText]) {
                              minQuantityObj[itemText] = itemQuantity;
                          } else {
                              minQuantityObj[itemText] += itemQuantity;
                          }
                          if (!minQuantityAmount[itemText]) {
                              minQuantityAmount[itemText] = nlapiLookupField('item', itemId, "minimumquantity");
                          }

                      }
                  }
              }

              //check min quan now
              for (var key in minQuantityObj) {
                  if (minQuantityObj[key] < minQuantityAmount[key]) {
                      alert(key + " does not meet the minimum order quantity");
                      return false;
                  }
              }

          }
      }
  } catch (e) {
      nlapiLogExecution('DEBUG', 'Error in saveRecord_minQuantityCheck', e);
  }
  return true;


}