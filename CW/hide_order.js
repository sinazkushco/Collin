//hide approve button based on role
var role = nlapiGetRole();
//sales manager 1005
//sales person 1006
//store  manager 1007
//warehouse rep 1008
//accountant 1010
//warehouse manager 1015
//sales and operations 1025
//branch manager 1027
//territory sales manager 1044
//if role matches then hide the approve button
if(role == 1005 || role == 1006 || role == 1007 || 
    role == 1008 || role == 1010 || role == 1015 || 
    role == 1025 || role == 1027 || role == 1044 ){

        jQuery('#tbl_approve').hide();
    }