// Used to be called BSP_EmployeeBeforeLoad
// Deployed:  https://system.na2.netsuite.com/app/common/scripting/scriptrecord.nl?id=261&whence=
// Deployed only on CREATE
function increment_new_empID(type,form){
    //GLOBALS TO SET
    var newEmployeeID = '';
    var highest_increment = '';

    //Find the highest EmployeeID currently in our system
    var employee_search = nlapiSearchRecord("employee", null, getSettings("FILTERS"), getSettings("COLUMNS"));
    if (employee_search != null){
        var row = employee_search[0];
        highest_increment = row.getValue('custentity2');
    }

    //Increment the EmployeeID and then set it.
    if (highest_increment === ''){
        newEmployeeID = 'EMP000001'
    } else {
        var next_increment = parseInt(highest_increment.substring(3), 10) + 1;
        newEmployeeID = '000000' + next_increment.toString();
        newEmployeeID = 'EMP' + newEmployeeID.substring(newEmployeeID.length - 6, newEmployeeID.length);
    }

    nlapiSetFieldValue('custentity2', newEmployeeID);
}

function getSettings(param){
    switch(param){
        case 'FILTERS':
            return [
                ["custentity2","startswith","EMP"]
            ];
        case 'COLUMNS':
            return [
                new nlobjSearchColumn("custentity2").setSort(true)
            ];
        default:
            return null;
    }
}