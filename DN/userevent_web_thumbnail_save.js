// 2.0 - Fluent
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @appliedtorecord inventoryitem
 */
define(["N/record", "N/log", "N/email", "N/search", "N/runtime"], function (record, log, email, search, runtime) {
	function updateWebThumbnail(context) {

        if(context.type == context.UserEventType.DELETE) {
          return;
        }
      
      
		var newRecord = context.newRecord;
		var internalId = newRecord.id;
		var recordType = newRecord.type;

		var loadedRecord = record.load({
			type: recordType,
			id: internalId,
			isDynamic: false,
			defaultValues: null
		});

		var primaryImageUrl = loadedRecord.getValue("custitem_primary_image") || "";
		var imagePath = primaryImageUrl.replace("https://www.kushbottles.com/", "");
		var webThumbnailField = loadedRecord.getValue("storedisplaythumbnail");

		//no image file in primary json field - end script
		if (primaryImageUrl === "https://www.kushbottles.com" || primaryImageUrl === "") {
			return;
		}

		//if there is a image path available, and the Web Thumbnail field is not filled out - proceed
		if (imagePath && !webThumbnailField) {
			try {
				var imageURL = searchFileCabinet(imagePath.split(".")[0]);

				if (imageURL) {
					log.debug("success!", "image internal ID: " + imageURL);
				} else {
					log.debug("no result returned", "file name: " + imagePath + " ,item internalid: " + internalId);
				}

				loadedRecord.setValue({
					fieldId: "storedisplaythumbnail",
					value: imageURL
				});
				loadedRecord.save();
			} catch (e) {
				log.debug("try catch: error", "Internal ID: " + internalId + " , Web Thumbnail image " + imagePath);
			}
		}

		function searchFileCabinet(imageName) {
			var itemURL = "";
			var folderSearchObj = search.create({
				type: "folder",
				filters: [
					["file.name", "contains", imageName]
				],
				columns: [
					search.createColumn({
						name: "name",
						join: "file"
					}),
					search.createColumn({
						name: "internalid",
						join: "file"
					})
				]
			});
			var searchResultCount = folderSearchObj.runPaged().count;
			folderSearchObj.run().each(function (result) {
				itemURL = result.getValue({
					name: "internalid",
					join: "file"
				});
				//log.debug("search result", itemURL)
				return true;
			});
			return itemURL;
		}
	}

	return {
		afterSubmit: updateWebThumbnail
	};
});

