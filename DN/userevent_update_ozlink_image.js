// 2.0 - Fluent
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @appliedtorecord inventoryitem
 */
define(["N/record", "N/log", "N/email", "N/search", "N/runtime"], function (record, log, email, search, runtime) {
	function updateOzlinkImage(context) {
		//log.debug("User Event Type", context.UserEventType);
        log.debug("User Event Type", context.type);

        if(context.type == context.UserEventType.DELETE) {
          return;
        }
        
		var newRecord = context.newRecord;
		var internalId = newRecord.id;
		var recordType = newRecord.type;

        var imageSearch = search.lookupFields({
			type: recordType,
			id: internalId,
			columns: ['custitem_primary_image', 'custitem_omp_item_image']
		});

		var primaryImageUrl = imageSearch.custitem_primary_image || "";
		var imagePath = primaryImageUrl.replace("https://www.kushbottles.com/", "");
		var ozlinkImageField = false;

		if(imageSearch.custitem_omp_item_image.length > 0) {
			ozlinkImageField = imageSearch.custitem_omp_item_image[0].value;
		}

		//no image file in primary json field - end script
		if (primaryImageUrl === "https://www.kushbottles.com" || primaryImageUrl === "") {
			return;
		}

		//if there is a image path available, and the ozlink field is not filled out - proceed
		if (imagePath && !ozlinkImageField) {
			try {
				var imageURL = searchFileCabinet(imagePath.split(".")[0]);

				if (imageURL) {
					log.debug("success!", "image internal ID: " + imageURL);
				} else {
					log.debug("no result returned", "file name: " + imagePath + " ,item internalid: " + internalId);
				}

				var submitRecord = record.submitFields({
					type: recordType,
					id: internalId,
					values: {
						'custitem_omp_item_image': imageURL
					}
				});

			} catch (e) {
				log.debug("try catch: error", "Internal ID: " + internalId + " , Ozlink image " + imagePath);
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
		afterSubmit: updateOzlinkImage
	};
});

