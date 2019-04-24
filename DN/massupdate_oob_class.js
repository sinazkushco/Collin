/**
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search", "N/log"], function (record, search, log) {
	function updateClass(context) {
		try {
			var recordUpdated = false;
			var internalId = context.id;
			var recordType = context.type;


			var REC = record.load({
				type: recordType,
				id: internalId,
				isDynamic: false,
				defaultValues: null
			});

			var lineCount = REC.getLineCount({
				sublistId: 'item'
			});

			//log.debug("line count", lineCount);

			if (lineCount > 0) {
				for (var ix = 0; ix < lineCount; ix++) {

					//checks if line item is an actual item - non-items have no quantity
					var itemCheck = REC.getSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						line: ix
					});

					if (itemCheck) {

						var itemID = REC.getSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: ix
						});


						var custItemClass = search.lookupFields({
							type: "item",
							id: itemID,
							columns: ['class']
						}).class[0];


						if (custItemClass) {
							recordUpdated = true;
							REC.setSublistValue({
								sublistId: 'item',
								fieldId: 'class',
								line: ix,
								value: custItemClass.value
							});
						}

					}





				} // for (var ix = 0; ix < ItemsSearchResults.length; ix++)
			} // if (ItemsSearchResults.length > 0)


			if (recordUpdated) {
				try {
					log.debug("SUCCESS: SAVE RECORD", internalId);
					REC.save();
				} catch (e) {
					log.error("ERROR: ATTEMPTED TO SAVE RECORD: " + internalId, e);
				}

			}
		} catch (error) {
            log.error("ERROR: SCRIPT COMPLETE FAILURE", error);
		}

	}


	return {
		each: updateClass
	};
});

