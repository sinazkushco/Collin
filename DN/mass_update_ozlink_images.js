/**
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search"], function (record, search) {
	function updateOzlinkImage(context) {

		var internalId = context.id;
		var recordType = context.type;

		var loadedRecord = record.load({
			type: recordType,
			id: internalId,
			isDynamic: false,
			defaultValues: null
		});

		var primaryImageUrl = loadedRecord.getValue("custitem_primary_image") || "";
		var imagePath = primaryImageUrl.replace("https://www.kushbottles.com/", "");
		var ozlinkImageField = loadedRecord.getValue("custitem_omp_item_image");

		if (primaryImageUrl === "https://www.kushbottles.com" || primaryImageUrl === "") {
			return;
		}

		if (imagePath) {
			try {
				loadedRecord.setText({
					fieldId: "custitem_omp_item_image",
					text: imagePath
				});
				loadedRecord.save();
			} catch (e) {
				log.debug("try catch: error", "Internal ID: " + internalId + " , Ozlink image " + imagePath);
              log.debug("error", e);
			}

		}

	}


	return {
		each: updateOzlinkImage
	};
});

