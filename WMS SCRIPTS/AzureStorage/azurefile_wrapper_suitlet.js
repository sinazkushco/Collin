/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-12-08      dbarnett         Created Script
*
*/
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @NAmdConfig ./config.json
 */
define(['./azure-storage.file.js', '../Libraries/xml_module.js', 'N/xml'],
/**
 * Module params:
 * 
 */
function(AzureStorage, xml_module, xml) {

	var accountName = 'kushqadb6a4r4';
	var share = 'ils';
	var directory = '/Interface/KushTest/';

	/**
	* Definition of the Suitelet script trigger point.
	*
	* @param {suiteletContext} context
	* @param {ServerRequest} context.request - Encapsulation of the incoming request
	* @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	* @Since 2015.2
	*/
	function onRequest(context) {
		var fileService = AzureStorage.FileService;
		
		var filesToGet = fileService.listFilesAndDirectories(share, directory);
		var xmlDocument  = xml.Parser.fromString({
			text : filesToGet
		});

		var filesObj = xml_module.xml_2_json(xmlDocument);
		// if (filesObj.Entries && filesObj.Entries.File) {
		// 	var filesArr = filesObj.Entries.File;
		// 	for (var i = 0; i < filesArr.length; i++) {
		// 		var fileText = fileService.getFileToText(share,  directory, filesArr[i].name);
		// 	}
		// }

		var fileName = 'ItemTest1.imxml';
		var fileText = fileService.getFileToText(share, '/Interface/Input/', fileName);

		// var xmlDocument  = xml.Parser.fromString({
		// 	text : fileText
		// });

		// var fileTextObj = xml_module.xml_2_json(xmlDocument);

		fileService.createFileFromText(share, directory, fileName, fileText);

		fileService.deleteFile(share, directory, fileName);


		var x = 2;
	}

	return {
		onRequest: onRequest
	}
});
