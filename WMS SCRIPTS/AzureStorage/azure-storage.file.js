/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 2.00       2018-12-06      dbarnett         Created Script
 *
 */
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/encode', 'N/error', 'N/url',
	'./constants.js', './util.js',
	'./WebResource.js', './SharedKey.js', 'N/runtime'],
	/**
	  * Module params:
	  * @param {https} https
	  * @param {encode} encode
	  */
	function (https, encode, error, url, Constants, azureutil, WebResource, SharedKey, runtime) {

		var HeaderConstants = Constants.HeaderConstants;
		var HttpConstants = Constants.HttpConstants;
		var QueryStringConstants = Constants.QueryStringConstants;
		var FileConstants = Constants.FileConstants;

		var prod = {
			_name: 'kushprod0vzn7',
			_key: 'fRVXfiXywXMjl3HG7C4G+oNEswOlWaT4D3X6bp4x+OfWZQ0AuTia4BsLwMP7dd8D9HmqxCjs3RdDgm3zgRb5og==',
			_host: { primaryHost: 'file.core.windows.net' }
		};

		var staging = {
			_name: 'kushstg3r5cq',
			_key: 'iMOnaLHOjR1+6uKK+i23zTLbm7C5oMfj7kECZt6KRj0zWg4XvwIoscNgjXWOvRebxQAnrvLOlmscaESToONcyA==',
			_host: { primaryHost: 'file.core.windows.net' }
		};

		var qa = {
			_name: 'kushqadb6a4r4',
			_key: 'dg6WwU4fhZsm3eM2MX0fWsvi8gxtR6HbST/Ntg4mkk4d1itP2l/nkjFq3lw8WGC4tGCjyhtsQhbZUzTfny6SCA',
			_host: { primaryHost: 'file.core.windows.net' }
		};

		function pointStorageBlobToEnvironment() {
			//something with runtime.EnvType.PRODUCTION
		}
		var storage_blob_to_point_to = staging
		//if(runtime.EnvType == 'PRODUCTION'){
		//	storage_blob_to_point_to = prod
		//}
	
		var storageSettings = storage_blob_to_point_to;	//pointStorageBlobToEnvironment will get the right blob to use

		/**
		* Builds the request options to be passed to the http.request method.
		* @ignore
		* @param {WebResource} webResource The webresource where to build the options from.
		* @param {object}      options     The request options.
		* @param {function(error, requestOptions)}  callback  The callback function.
		*/
		function _buildRequestOptions(webResource, body, options, callback) {
			webResource.withHeader(HeaderConstants.STORAGE_VERSION, HeaderConstants.TARGET_STORAGE_VERSION);
			webResource.withHeader(HeaderConstants.MS_DATE, new Date().toUTCString());
		}

		var path = {
			// path.normalize(path)
			// posix version
			normalize: function (path) {
				var isAbsolute = this.isAbsolute(path),
					trailingSlash = path && path[path.length - 1] === '/';

				// Normalize the path
				path = this.normalizeArray(path.split('/'), !isAbsolute).join('/');

				if (!path && !isAbsolute) {
					path = '.';
				}
				if (path && trailingSlash) {
					path += '/';
				}

				return (isAbsolute ? '/' : '') + path;
			},

			// posix version
			isAbsolute: function (path) {
				return path.charAt(0) === '/';
			},

			// resolves . and .. elements in a path array with directory names there
			// must be no slashes or device names (c:\) in the array
			// (so also no leading and trailing slashes - it does not distinguish
			// relative and absolute paths)
			normalizeArray: function (parts, allowAboveRoot) {
				var res = [];
				for (var i = 0; i < parts.length; i++) {
					var p = parts[i];

					// ignore empty parts
					if (!p || p === '.')
						continue;

					if (p === '..') {
						if (res.length && res[res.length - 1] !== '..') {
							res.pop();
						} else if (allowAboveRoot) {
							res.push('..');
						}
					} else {
						res.push(p);
					}
				}

				return res;
			}
		}

		// Utility methods

		/**
		* Create resource name
		* @ignore
		*
		* @param {string} share          Share name
		* @param {string} [directory]    Directory name
		* @param {string} [file]         File name
		* @return {string} The encoded resource name.
		*/
		function createResourceName(share, directory, file, forSAS) {
			var encode = function (name) {
				if (name && !forSAS) {
					name = encodeURIComponent(name);
					name = name.replace(/%2F/g, '/');
					name = name.replace(/%5C/g, '/');
					name = name.replace(/\+/g, '%20');
				}
				return name;
			};

			if (share[0] !== '/') {
				share = ('/') + share;
			}
			var name = share;

			if (directory) {
				// if directory does not start with '/', add it
				if (directory[0] !== '/') {
					name += ('/');
				}

				name += encode(directory);
			}

			if (file) {
				// if the current path does not end with '/', add it
				if (name[name.length - 1] !== '/') {
					name += ('/');
				}

				name += encode(file);
			}

			return path.normalize(name).replace(/\\/g, '/');
		}

		/**
		* Creates a new FileService object.
		* If no connection string or storageaccount and storageaccesskey are provided,
		* the AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCESS_KEY environment variables will be used.
		* @class
		* The FileService class is used to perform operations on the Microsoft Azure File Service.
		* The File Service provides storage for binary large objects, and provides functions for working with data stored in files.
		* @constructor
		* @extends {StorageServiceClient}
		*
		* @param {string} [storageAccountOrConnectionString]  The storage account or the connection string.
		* @param {string} [storageAccessKey]                  The storage access key.
		* @param {string|object} [host]                       The host address. To define primary only, pass a string. 
		*                                                     Otherwise 'host.primaryHost' defines the primary host and 'host.secondaryHost' defines the secondary host.
		* @param {string} [sasToken]                          The Shared Access Signature token.
		* @param {string} [endpointSuffix]                    The endpoint suffix.
		*/
		function FileService(storageAccountOrConnectionString, storageAccessKey, host, sasToken, endpointSuffix) {

			// var storageServiceSettings = StorageServiceClient.getStorageSettings(storageAccountOrConnectionString, storageAccessKey, host, sasToken, endpointSuffix);
			//this.StorageService = new StorageServiceClient(storageAccountOrConnectionString, storageAccessKey, host);

			/**
			* Downloads a file into a text string.
			*
			* @this {FileService}
			* @param {string}             share                                       The share name.
			* @param {string}             directory                                   The directory name. Use '' to refer to the base directory.
			* @param {string}             file                                        The file name. File names may not start or end with the delimiter '/'.
			* @param {object}             [options]                                   The request options.
			*
			*/
			this.getFileToText = function (share, directory, file, optionsOrCallback, callback) {

				var resourceName = createResourceName(share, directory, file);
				var webResource = WebResource.get(resourceName);

				var responseString = this.performRequest(webResource, null);
				//responseString base64 encoded when submitting via postman/script, but adding file via Azure storage explorer was not...
				if (responseString.replace(/\s/g, '').substring(0, 1) !== '<') {
					responseString = encode.convert({
						string: responseString,
						inputEncoding: encode.Encoding.BASE_64,
						outputEncoding: encode.Encoding.UTF_8
					});
				}

				return responseString;

			};

			/**
			* Creates a file of the specified length. If the file already exists on the service, it will be overwritten.
			*
			* @this {FileService}
			* @param {string}             share                                         The share name.
			* @param {string}             directory                                     The directory name. Use '' to refer to the base directory.
			* @param {string}             file                                          The file name. File names may not start or end with the delimiter '/'.
			* @param {int}                length                                        The length of the file in bytes.
			* @param {object}             [options]                                     The request options.
			* @param {object}             [options.contentSettings]                     The file's content settings.
			* @param {string}             [options.contentSettings.contentType]         The MIME content type of the file. The default type is application/octet-stream.
			* 
			*/
			this.createFile = function (share, directory, file, length, options, callback) {

				var resourceName = createResourceName(share, directory, file);
				var webResource = WebResource.put(resourceName)
					.withHeader(HeaderConstants.TYPE, 'file')
					.withHeader(HeaderConstants.FILE_CONTENT_LENGTH, length.toString())
					//.withHeader(HeaderConstants.FILE_CONTENT_TYPE, 'text/xml');
					//.withHeader(HeaderConstants.CONTENT_LENGTH, 9)
					.withHeader(HeaderConstants.CONTENT_TYPE, 'text/xml')


				return this.performRequest(webResource, null);
			};

			this._updateFilesImpl = function (share, directory, file, rangeStart, rangeEnd, writeMethod, options) {
				var resourceName = createResourceName(share, directory, file);
				var webResource = WebResource.put(resourceName)
					.withQueryOption(QueryStringConstants.COMP, 'range')
					.withHeader(HeaderConstants.CONTENT_TYPE, 'text/xml')//'application/octet-stream')
					.withHeader(HeaderConstants.FILE_WRITE, writeMethod);

				if (writeMethod === FileConstants.RangeWriteOptions.UPDATE) {
					var size = (rangeEnd - rangeStart) + 1;
					webResource.withHeader(HeaderConstants.CONTENT_LENGTH, size);
				} else {
					webResource.withHeader(HeaderConstants.CONTENT_LENGTH, 0);
				}

				return webResource;
			};

			/**
			* Updates a file from text.
			* @ignore
			*
			* @this {FileService}
			* @param {string}             share                                       The share name.
			* @param {string}             directory                                   The directory name. Use '' to refer to the base directory.
			* @param {string}             file                                        The file name. File names may not start or end with the delimiter '/'.
			* @param {string}             text                                        The text string.
			* @param {Readable}           readStream                                  The Node.js Readable stream.
			* @param {int}                rangeStart                                  The range start.
			* @param {int}                rangeEnd                                    The range end.
			* @param {object}             [options]                                   The request options.
			*
			*/
			this._createRanges = function (share, directory, file, text, readStream, rangeStart, rangeEnd, options, callback) {
				var request = this._updateFilesImpl(share, directory, file, rangeStart, rangeEnd, FileConstants.RangeWriteOptions.UPDATE, options);

				// Range
				if (!azureutil.objectIsNull(rangeStart)) {
					var range = 'bytes=' + rangeStart + '-';

					if (!azureutil.objectIsNull(rangeEnd)) {
						range += rangeEnd;
					}

					request.withHeader(HeaderConstants.STORAGE_RANGE, range);
				}

				//options.url += '?comp=range'; //would be done in serviceClient

				return this.performRequest(request, text, options);
			};

			/**
			* Uploads a file from a text string. If the file already exists on the service, it will be overwritten.
			*
			* @this {FileService}
			* @param {string}             share                                         The share name.
			* @param {string}             directory                                     The directory name. Use '' to refer to the base directory.
			* @param {string}             file                                          The file name. File names may not start or end with the delimiter '/'.
			* @param {string|object}      text                                          The file text, as a string or in a Buffer.
			* @param {object}             [options]                                     The request options.
			* @param {SpeedSummary}       [options.speedSummary]                        The upload tracker objects;
			* @param {bool}               [options.storeFileContentMD5]                 Specifies whether the file's ContentMD5 header should be set on uploads. 
			*                                                                           The default value is false for files.
			* @param {bool}               [options.useTransactionalMD5]                 Calculate and send/validate content MD5 for transactions.
			* @param {object}             [options.contentSettings]                     The file's content settings.
			* @param {string}             [options.contentSettings.contentType]         The MIME content type of the file. The default type is application/octet-stream.
			* 
			*/
			this.createFileFromText = function (share, directory, file, text, optionsOrCallback, callback) {

				var length = azureutil.objectIsNull(text) ? 0 : byteLength(text);
				if (length > FileConstants.MAX_UPDATE_FILE_SIZE) {
					throw error.create({ name: 'INVALID_FILE_LENGTH', message: 'createFileFromText requires the size of text to be less than 4MB.', notifyOff: false });
				}

				var responseBody = this.createFile(share, directory, file, length);
				if (!responseBody) { //body is empty on success of CreateFile
					responseBody = this._createRanges(share, directory, file, text, null, 0, length - 1);

					if (responseBody) { //body is empty on success of adding data/range to File
						throw error.create({ name: 'CREATE_RANGE_ERROR', message: responseBody, notifyOff: false });
					}
				}
				else {
					throw error.create({ name: 'CREATE_FILE_ERROR', message: responseBody, notifyOff: false });
				}

			};

			/**
			* Lists a segment containing a collection of file items in the directory.
			*
			* @this {FileService}
			* @param {string}             share                               The share name.
			* @param {string}             directory                           The directory name. Use '' to refer to the base directory.
			* @param {object}             [options]                           The request options.
			*
			*/
			this.listFilesAndDirectories = function (share, directory, prefix, currentToken, optionsOrCallback, callback) {
				// options.url += '?restype=directory&comp=list';

				var webResource = WebResource.get(createResourceName(share, directory))
					.withQueryOption(QueryStringConstants.RESTYPE, 'directory')
					.withQueryOption(QueryStringConstants.COMP, 'list');

				return this.performRequest(webResource, null);
			};

			/**
			* Marks the specified file for deletion. The file is later deleted during garbage collection.
			*
			* @this {FileService}
			* @param {string}             share                                       The share name.
			* @param {string}             directory                                   The directory name. Use '' to refer to the base directory.
			* @param {string}             file                                        The file name. File names may not start or end with the delimiter '/'.
			* @param {object}             [options]                                   The request options.
			*
			*/
			this.deleteFile = function (share, directory, file, optionsOrCallback, callback) {

				var resourceName = createResourceName(share, directory, file);
				var webResource = WebResource.del(resourceName);

				var responseBody = this.performRequest(webResource, null);
				if (responseBody) { //body is empty on success of CreateFile
					throw error.create({ name: 'DELETE_FILE_ERROR', message: responseBody, notifyOff: false });
				}
			};

			/**
			* Performs a REST service request through HTTP expecting an input stream.
			* @ignore
			*
			* @param {WebResource} webResource                        The webresource on which to perform the request.
			* @param {string}      outputData                         The outgoing request data as a raw string.
			* @param {object}      [options]                          The request options.
			*
			*/
			this.performRequest = function (webResource, outputData, options) {

				var fullPath = url.format({ domain: 'https://' + storageSettings._name + '.file.core.windows.net' + webResource.path, params: webResource.queryString });
				if (fullPath.lastIndexOf('?') == fullPath.length - 1) {
					fullPath = fullPath.slice(0, -1);
				}

				_buildRequestOptions(webResource);

				var sharedKey = new SharedKey(storageSettings._name, storageSettings._key);
				sharedKey.signRequest(webResource);

				if (webResource.method == HttpConstants.HttpVerbs.GET) {
					var response = https.get({
						url: fullPath,
						headers: webResource.headers
					});
				}
				else if (webResource.method == HttpConstants.HttpVerbs.PUT) {
					var response = https.put({
						url: fullPath,
						body: outputData,
						headers: webResource.headers
					});
				}
				else if (webResource.method == HttpConstants.HttpVerbs.DELETE) {
					var response = https.delete({
						url: fullPath,
						headers: webResource.headers
					});
				}

				var goodCodes = [200, 201, 202]
				if (goodCodes.indexOf(response.code) == -1) {
					throw error.create({ name: 'REQUEST_ERROR', message: response.body, notifyOff: false });
				}

				return response.body;
			};
		}

		//util.inherits(FileService, StorageServiceClient);

		/**
		 * Function to fix native charCodeAt()
		 *
		 * Now, we can use fixedCharCodeAt("foo€", 3); for multibyte (non-bmp) chars too.
		 *
		 * @access public
		 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/charCodeAt
		 * @note If you hit a non-bmp surrogate, the function will return false
		 * @param str String Mixed string to get charcodes
		 * @param idx Integer Position of the char to get
		 * @return code Integer Result charCodeAt();
		 */
		function fixedCharCodeAt(str, idx) {
			idx = idx || 0;
			var code = str.charCodeAt(idx);
			var hi, low;
			if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
				hi = code;
				low = str.charCodeAt(idx + 1);
				if (isNaN(low)) {
					throw 'Kein gültiges Schriftzeichen oder Speicherfehler!';
				}
				return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
			}
			if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
				// We return false to allow loops to skip this iteration since should have already handled high surrogate above in the previous iteration
				return false;
				/*hi = str.charCodeAt(idx-1);
				low = code;
				return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;*/
			}
			return code;
		}

		/**
		 * Gets size of a UTF-8 string in bytes
		 *
		 * @autor Frank Neff <fneff89@gmail.com>
		 * @license GPL v2
		 * @access public
		 * @param str String Input string to get bytesize
		 * @return result String Size of the input string in bytes
		 */
		function byteLength(str) {
			var result = 0;
			for (var n = 0; n < str.length; n++) {
				var charCode = fixedCharCodeAt(str, n);
				if (typeof charCode === "number") {
					if (charCode < 128) {
						result = result + 1;
					} else if (charCode < 2048) {
						result = result + 2;
					} else if (charCode < 65536) {
						result = result + 3;
					} else if (charCode < 2097152) {
						result = result + 4;
					} else if (charCode < 67108864) {
						result = result + 5;
					} else {
						result = result + 6;
					}
				}
			}
			return result;
		}



		function createFileService(storageAccountOrConnectionString, storageAccessKey, host) {
			return new FileService(storageAccountOrConnectionString, storageAccessKey, host);
		}

		return {
			FileService: createFileService(storageSettings._name, storageSettings._key, storageSettings._host)
		};

	});