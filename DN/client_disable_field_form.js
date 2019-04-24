//client side script to disable sales rep field - only deployed to edit

function pageInit(type) {
	var users = ["541", "530", "112898"]; //Brice Murtaugh, Phil McCutcheon
	var currentUser = nlapiGetContext().getUser();
	if (users.indexOf(currentUser) > -1) {
		nlapiSetFieldDisabled("salesrep", true);
	}

}