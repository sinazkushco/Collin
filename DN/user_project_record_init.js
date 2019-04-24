/**
 *@NApiVersion 2.x
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */
define([], runUserEvent);
 
function runUserEvent() {
    var returnObj = {};
    returnObj.beforeLoad = beforeLoad;
    return returnObj;
}
 
function beforeLoad(context) {
    //SEARCHMODULE.load(123);
    var type = context.type;
  log.debug(type);
    if(type =="create"){
      log.debug("function triggered");
        var form = context.newRecord.getValue("customform");
        if(form == "83"){
            context.newRecord.setValue("subsidiary", "4"); // The Hybrid Creative
            log.debug("form", form);
            log.debug("set to kb hybrid");
        } else if (form == "62"){
            log.debug("form", form);
            log.debug("set to kb us");
            context.newRecord.setValue("subsidiary", "1"); // Kush Bottles US
        }
    }
    // log.debug('beforeLoad Triggered');
    // log.debug(context.newRecord.getValue("customform"));
    // context.newRecord.setValue("subsidiary", "7");
    // context.newRecord;
    // log.debug("type", context.type);
    // context.form;
    return;
}
 