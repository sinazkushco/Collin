var TASK;

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(["N/task"], run_suitelet);

//********************** MAIN FUNCTION **********************
function run_suitelet(task) {
    TASK = task;

    var return_obj = {};
    return_obj.onRequest = execute;
    return return_obj;
}

function execute(context) {
    if (context.request.method == 'GET') {
        try{
            log.debug("Running Receipt Upload Every Minute - Starting");
            var mapReduce = TASK.create({
                taskType: TASK.TaskType.MAP_REDUCE,
                scriptId: "customscript_azure_receipt_inbound",
                deploymentId: "customdeploy_azure_receipt_inbound_now",
                params: {}
            });

            mapReduce.submit();
            log.debug("Running Receipt Upload Every Minute - Finished");
        } catch (errrr2){
            log.debug("Running Receipt Upload Every Minute - Errored Out");
            context.response.write(JSON.stringify(errrr2));
        }
        
        context.response.write('Script Executed');
    }
    return;
}

//wms cutover: https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=1084&deploy=1&compid=4516274_SB3&h=8844e242e964d0b72351

//production: https://forms.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=1083&deploy=1&compid=4516274&h=994c9991f69ad8017cd6