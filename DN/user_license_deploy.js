function beforeLoad(type, form) {
    if (nlapiGetContext().getExecutionContext() == 'userinterface') {
        form.setScript('373');//<< SET THIS TO YOUR SCRIPT ID
    }
}