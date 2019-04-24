function sendReorderItemsEmail_afterSubmit(type) {
	
	try {
		var transaction = nlapiLoadRecord('customrecord_pi_reorder_transaction', nlapiGetRecordId());
		if ((type == 'create' || type == 'edit') && transaction.getFieldValue('custrecord_pi_reorder_enable_ue') === 'T') {
			sendEmail(transaction);
		}
	} catch (error) {
		nlapiLogExecution('ERROR', 'error sending email', error);
	}
	
}

function sendEmail(transaction) {
	
	var context = nlapiGetContext();
	var author = context.getSetting('SCRIPT', 'custscript_pi_reorder_email_author') || '1182757';
	
	var customer = getCustomer(transaction);
	var salesrep = getSalesrep(customer);
	var emailBody = getEmailBody(transaction, customer, salesrep);

	nlapiSendEmail(author, salesrep.getId(), 'Custom Product Order: Reorder Items', emailBody, null, null, {
		'custrecord_pi_reorder_line_transaction': transaction.getId(),
		entity: customer.getId(),
		employee: salesrep.getId()
	});
	
}

function getCustomer(transaction) {
	var customerInternalId = transaction.getFieldValue('custrecord_pi_reorder_entity');
	var customer = nlapiSearchRecord('customer', null, new nlobjSearchFilter('internalid', null, 'anyof', customerInternalId), [
		new nlobjSearchColumn('companyname'),
		new nlobjSearchColumn('salesrep')
	]);
	return customer ? customer[0] : null;
}

function getSalesrep(customer) {
	var salesrepInternalId = customer.getValue('salesrep');
	var salesrep = nlapiSearchRecord('employee', null, new nlobjSearchFilter('internalid', null, 'anyof', salesrepInternalId), [
		new nlobjSearchColumn('firstname'),
		new nlobjSearchColumn('lastname')
	]);
	return salesrep ? salesrep[0] : null;
}

function getTransactionLines(transaction) {
	nlapiLogExecution('DEBUG', 'transaction id', transaction.getId());
	var lines = nlapiSearchRecord('customrecord_pi_reorder_line_item', null, new nlobjSearchFilter('custrecord_pi_reorder_line_transaction', null, 'is', transaction.getId()), [
		new nlobjSearchColumn('custrecord_pi_reorder_line_quantity'),
		new nlobjSearchColumn('itemid', 'custrecord_pi_reorder_line_item'),
		new nlobjSearchColumn('custitem_sku', 'custrecord_pi_reorder_line_item')
	]);
	nlapiLogExecution('DEBUG', 'lines', JSON.stringify(lines));
	return lines || [];
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
	
	html += format('<p><b>Reorder Items</b></p><br />\n', {
		internalid: transaction.getId(),
		tranid: transaction.getId()
	});
	
	html += '<ol>\n';
	var lines = getTransactionLines(transaction);
	for (var l = 0; l < lines.length; l += 1) {
		var line = lines[l];
		html += format('\t<li><b>(Qty. {qty})</b> {itemid} SKU: {sku}</li>\n', {
			qty: line.getValue('custrecord_pi_reorder_line_quantity'),
			itemid: line.getValue('itemid', 'custrecord_pi_reorder_line_item'),
			sku: line.getValue('custitem_sku', 'custrecord_pi_reorder_line_item')
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
