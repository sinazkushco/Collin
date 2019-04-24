/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-12-14      dbarnett         Created Script
*
*/
/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @NAmdConfig ./xlsx_config.json
 */
define(['N/encode','N/file','N/record', 'N/search', 'N/xml', 
		'../Libraries/moment.min.js',
		'../Libraries/xml_module.js', '../AzureStorage/azure-storage.file.js', 'XLSX'],
/**
  * Module params:
  * @param {encode} encode
  * @param {file} file
  * @param {record} record
  * @param {search} search
  */
 function(encode, file, record, search, xml, moment, xml_module, AzureStorage, XLSX) {

	var share = 'ils';
	var directory = '/Interface/KUSHTest/inventorybalanceUpload';

	/**
	* Definition of the Scheduled script trigger point.
	*
	* @param {scheduledContext} context
	* @param {string} context.type - The context in which the script is executed. It is one of the values from the context.InvocationType enum.
	* @Since 2015.2
	*/
	function execute(context) {

		var fileService = AzureStorage.FileService;

        var filesToGet = fileService.listFilesAndDirectories(share, directory);

		var xmlDocument  = xml.Parser.fromString({
			text : filesToGet
		});

        var filesObj = xml_module.xml_2_json(xmlDocument);
        log.debug({ title : 'filesObj', details : filesObj });

		var filesArr = [];
        if (filesObj.Entries && filesObj.Entries.File) {

			//if only one file will be Object, else is Array of Objects
			var files = filesObj.Entries.File;

			filesArr = files instanceof Array ? files : [files];
		}
		
		filesArr.forEach(function(fileObj) {

			var fileName = fileObj['Name'];
       
			var fileService = AzureStorage.FileService;

			var fileText = fileService.getFileToText(share,  directory, fileName);
			log.debug({ title : 'fileText for ' + fileName, details : (fileText || '').substring(0,200) });

			//Convert raw XML string to xml DOM Object
			var xmlDocument  = xml.Parser.fromString({
				text : fileText
			});
			
			//Convert XML DOM to JSON object
			var fileTextObj = xml_module.xml_2_json(xmlDocument);

			var wb_file = createWorkBook(fileTextObj);
			if (wb_file) {
				try {
					var excelFile = file.create({
						name : wb_file.fileName,
						fileType : file.Type.EXCEL,
						folder : 830696,
						contents : wb_file.base64Content
					});
		
					var fileId = excelFile.save();
					log.debug({ title : 'fileId', details : fileId });
		
					//Delete from Azure File Storage
					// fileService.deleteFile(share, directory, fileName);
					
				} catch (e) {
					log.debug({ title : 'ERROR', details : e });
				}
			}
		});
	}

	/**
	 * Takes Json object, Returns Base64 encoded string of Excel
	 * 
	 * @param {Object} fileTextObj 
	 */
	function createWorkBook(fileTextObj) {
		var workBookDataArr = [];
		var dateStr = '';
		try {
			var WMFWUpload = fileTextObj.WMWDATA.WMFWUpload;

			var InventoryArr = WMFWUpload.Inventories.Inventory;
			dateStr = moment(WMFWUpload.Date).format('YYYY_M_D');
			

			InventoryArr.forEach(function(inventoryObj) {
				var flatObject = flattenObject(inventoryObj);

				workBookDataArr.push(flatObject);
			});

			var columnLengths = getColumnWidths(workBookDataArr);

		} catch (e) {
			log.debug({ title : 'ERROR', details : e });
		}

		//Create Excel WorkBook
		var wb = XLSX.utils.book_new();
		//create Excel Sheet
		var ws = XLSX.utils.json_to_sheet(workBookDataArr);

		//Set Column lengths  ..only works for .xlsX fileType
		ws['!cols'] = columnLengths;

		/* Add the worksheet to the workbook */
		XLSX.utils.book_append_sheet(wb, ws, 'InventoryBalance');

		//create workBook file data
		var wb_file = XLSX.write(wb, { type : 'base64', bookType : 'xlsx'});

		return {
			base64Content : wb_file,
			fileName : 'InventoryBalanceReport_' + dateStr + '.xlsx'
		}
	}


	function getKeyValues(obj, prefix) {
		var keys = Object.keys(obj);
		prefix = prefix ? prefix + '.' : '';
		return keys.reduce(function(result, key){
			if(obj[key] !== null && Object.prototype.toString.call(obj[key]) === '[object Object]'){
				result = result.concat(getKeyValues(obj[key], prefix + key));
			}else{
				result.push({ key : prefix + key, value : obj[key]});
			}
			return result;
		}, []);
	}
	/**
	 * Returns all key/value pairs of nested object
	 * 
	 * @param {Object} obj
	 */
	function flattenObject(obj) {

		var keyValues = getKeyValues(obj);
		var finalObj = {};

		keyValues.forEach(function(element) {
			finalObj[element.key] = element.value;
		});
		
		return finalObj;
	}


	function getColumnWidths(arr) {
		var colInfoArr = [];
		var colInfoObj = {};

		arr.forEach(function(obj) {
			var colHeaderNames = Object.keys(obj);
			colHeaderNames.forEach(function(colName) {
				if (!colInfoObj.hasOwnProperty(colName)) {
					colInfoObj[colName] = colName.length;
				}
			});

			for (var colName in obj) {
				var charLen = (obj[colName] || '').length;

				if (charLen > colInfoObj[colName]) {
					colInfoObj[colName]  = charLen
				}
			}
		});

		//log.debug({ title : 'colInfoObj', details : colInfoObj });
		for (var colName in colInfoObj) {
			var charLen = colInfoObj[colName];
			colInfoArr.push({ 'wch' : charLen });
		}

		// log.debug({ title : 'colInfoArr', details : colInfoArr });
		return colInfoArr;
	}


	/**
	 * 
	 * @param {string|number} fileId 
	 */
	function getFileContents(fileId) {
		var fileObj = file.load({
			id: fileId
		});

		var contents = fileObj.getContents();
		return contents;
	}


	return {
		execute: execute
	}
});
