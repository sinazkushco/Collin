function sendRequestShipmentEmail_afterSubmit() {
	
	try {
		var transaction = nlapiLoadRecord('estimate', nlapiGetRecordId());
		if (transaction.getFieldValue('custbody_contains_private_items') === 'T') {
			sendEmail(transaction);
		}
	} catch (error) {
		nlapiLogExecution('ERROR', 'error sending email', error);
	}
	
}

function sendEmail(transaction) {
	
	var context = nlapiGetContext();
	var author = context.getSetting('SCRIPT', 'custscript_pi_shipment_email_author') || '1182757';
	
	var customer = getCustomer(transaction);
	var salesrep = getSalesrep(transaction);
	var emailBody = getEmailBody(transaction, customer, salesrep);

	nlapiSendEmail(author, salesrep.getId(), 'Custom Product Order: Request Shipment', emailBody, null, null, {
		transaction: transaction.getId(),
		entity: customer.getId(),
		employee: salesrep.getId()
	});
	
}

function getCustomer(transaction) {
	var customerInternalId = transaction.getFieldValue('entity');
	var customer = nlapiSearchRecord('customer', null, new nlobjSearchFilter('internalid', null, 'anyof', customerInternalId), [
		new nlobjSearchColumn('companyname')
	]);
	return customer ? customer[0] : null;
}

function getSalesrep(transaction) {
	var salesrepInternalId = transaction.getFieldValue('salesrep');
	var salesrep = nlapiSearchRecord('employee', null, new nlobjSearchFilter('internalid', null, 'anyof', salesrepInternalId), [
		new nlobjSearchColumn('firstname'),
		new nlobjSearchColumn('lastname')
	]);
	return salesrep ? salesrep[0] : null;
}

function getItem(transaction, i) {
	var itemInternalId = transaction.getLineItemValue('item', 'item', i);
	var item = nlapiSearchRecord('item', null, new nlobjSearchFilter('internalid', null, 'anyof', itemInternalId), [
		new nlobjSearchColumn('itemid'),
		new nlobjSearchColumn('custitem_sku')
	]);
	return item ? item[0] : null;
}

function getEmailBody(transaction, customer, salesrep) {
	
	var html = '';
	html += format('<p>Hello, {firstname} {lastname},</p><br />\n\n', {
		firstname: salesrep.getValue('firstname'),
		lastname: salesrep.getValue('lastname')
	});
	
	html += format('<p>Your customer, <b>{name}</b>, has submitted the following order:</p><br />\n\n', {
		name: customer.getValue('companyname')
	});
	
	html += format('<p><b>Request Shipment</b> <a href="https://system.netsuite.com/app/accounting/transactions/estimate.nl?id={internalid}">Estimate #{tranid}</a></p><br />\n', {
		internalid: transaction.getId(),
		tranid: transaction.getFieldValue('tranid')
	});
	
	html += '<ol>\n';
	for (var i = 1; i <= transaction.getLineItemCount('item'); i += 1) {
		var item = getItem(transaction, i);
		html += format('\t<li><b>(Qty. {qty})</b> {itemid} SKU: {sku}</li>\n', {
			qty: transaction.getLineItemValue('item', 'quantity', i),
			itemid: item.getValue('itemid'),
			sku: item.getValue('custitem_sku')
		});
	}	
	html += '</ol><br />\n';
	
	html += '<p>Please reach out to them as soon as possible.</p><br />\n';
	html += '<p>Thank you.</p>';
	
	return html;
	
}

// A utility function that makes interpolating variables into strings
// substantially cleaner
function format(string, vars) {
	if (vars) {
		for (var k in vars) {
			string = string.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
		}
	}
	return string;
}
