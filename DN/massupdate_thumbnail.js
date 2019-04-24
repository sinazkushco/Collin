/**
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search"], function (record, search) {
	function updateWebThumbnail(context) {

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
		var webThumbnailField = loadedRecord.getValue("storedisplaythumbnail");

		//some fields have default kushbottles url with no image path, stop functiion if that is the case.
		if (primaryImageUrl === "https://www.kushbottles.com" || primaryImageUrl === "") {
			return;
		}

		//if an image path exist and the Web Thumbnail field is empty
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
		each: updateWebThumbnail
	};
});

