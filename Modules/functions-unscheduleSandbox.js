/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 * define path: "/SuiteScripts/Modules/functions-unscheduleSandbox"
 */

define(["N/record", "N/log", "N/runtime", "N/search"], function (record, log, runtime, search) {
    function checkEnvironment(context) {
        //unschedules script if sandbox
        if (runtime.envType === "SANDBOX") {
            try {
                var deploymentID = runtime.getCurrentScript().deploymentId;
                var result = undeployScript( deploymentID );
                if (result.success){
                    log.audit( result.title, 'Undeployed Script Deployment Record '+ result.success );
                    return true;
                } else {
                    log.error( result.title, 'Failed to record.save() the undeployment. Aborting attempt to undeploy, resuming as normal' );
                }
            } catch (error){
                if (error instanceof nlobjError){//
                    log.error('Error thrown in script when attempting to undeploy, nlobjError.getDetails()', error.getDetails());//
                } else {//
                    try {//
                        log.error('Error thrown in script when attempting to undeploy, error.toString()', error.toString() );//goes into here it seems
                    } catch (e) {//
                        log.error('Error thrown in script when attempting to undeploy, error.message', error.message );//
                    }//
                }//
            }
        }
        return false;
    }
    function undeployScript(deploymentID){
        var output = {
            title: 'empty',
            success: false
        };
        var CONSTANTS = {
            STATUS: {name: 'status'},
            INTERNALID: {name: 'internalid'},
            DEPLOYED: 'isdeployed',
            TITLE: 'title'
        };
        log.debug('attempting to search internalID of '+deploymentID, deploymentID);

        //logic begins here
        //find the internalid of a script deployment using the deployment id
        var scriptdeploymentSearch = search.create({
            type: record.Type.SCRIPT_DEPLOYMENT,
            filters: [ ["scriptid", "is", deploymentID] ],
            columns: [CONSTANTS.INTERNALID.name, CONSTANTS.STATUS.name]
        });
        scriptdeploymentSearch.run().each(function(result){
            //only one result should be returned.
            //we only undeploy scheduled scripts so we can still run ondemand scripts without issues
            if (result.getValue(CONSTANTS.STATUS) === 'SCHEDULED'){
                var scriptDeployment = record.load({
                    type: record.Type.SCRIPT_DEPLOYMENT,
                    id: result.getValue(CONSTANTS.INTERNALID)
                });
                log.debug('record loaded successfully', scriptDeployment);
                scriptDeployment.setValue(CONSTANTS.DEPLOYED, false);
                output.title = scriptDeployment.getValue(CONSTANTS.TITLE) || 'Script has no title';
                output.success = scriptDeployment.save() || false;
            }
            return true;
        });
        return output;
    }

    return {
        checkEnvironment: checkEnvironment
    };
});