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
define(['./constants.js', './util.js', './Libraries/cryptojs.js'],
  /**
    * Module params:
    */
  function (Constants, azureutil, CryptoJS) {

    var HeaderConstants = Constants.HeaderConstants;
    var HttpConstants = Constants.HttpConstants;
    var QueryStringConstants = Constants.QueryStringConstants;

    /**
    * Creates a new SharedKey object.
    *
    * @constructor
    * @param {string} storageAccount    The storage account.
    * @param {string} storageAccessKey  The storage account's access key.
    * @param {bool}   usePathStyleUri   Boolean value indicating if the path, or the hostname, should include the storage account.
    */
    function SharedKey(storageAccount, storageAccessKey, usePathStyleUri) {
      this.storageAccount = storageAccount;
      this.storageAccessKey = storageAccessKey;
      this.usePathStyleUri = usePathStyleUri;
      this.signer = new HmacSha256Sign(storageAccessKey);

      /**
      * Signs a request with the Authentication header.
      *
      * @param {WebResource}      webResource The webresource to be signed.
      * @param {function(error)}  callback    The callback function.
      */
      this.signRequest = function (webResource, callback) {
        var getvalueToAppend = function (value, headerName) {
          // Do not sign content-length 0 in 2014-08-16 and later
          if (headerName === HeaderConstants.CONTENT_LENGTH && (azureutil.objectIsNull(value[headerName]) || value[headerName].toString() === '0')) {
            return '\n';
          } else if (azureutil.objectIsNull(value) || azureutil.objectIsNull(value[headerName])) {
            return '\n';
          } else {
            return value[headerName] + '\n';
          }
        };

        var stringToSign =
          webResource.method + '\n' +
          getvalueToAppend(webResource.headers, HeaderConstants.CONTENT_ENCODING) +
          getvalueToAppend(webResource.headers, HeaderConstants.CONTENT_LANGUAGE) +
          getvalueToAppend(webResource.headers, HeaderConstants.CONTENT_LENGTH) +
          getvalueToAppend(webResource.headers, HeaderConstants.CONTENT_MD5) +
          getvalueToAppend(webResource.headers, HeaderConstants.CONTENT_TYPE) +
          getvalueToAppend(webResource.headers, HeaderConstants.DATE) +
          getvalueToAppend(webResource.headers, HeaderConstants.IF_MODIFIED_SINCE) +
          getvalueToAppend(webResource.headers, HeaderConstants.IF_MATCH) +
          getvalueToAppend(webResource.headers, HeaderConstants.IF_NONE_MATCH) +
          getvalueToAppend(webResource.headers, HeaderConstants.IF_UNMODIFIED_SINCE) +
          getvalueToAppend(webResource.headers, HeaderConstants.RANGE) +
          this._getCanonicalizedHeaders(webResource) +
          this._getCanonicalizedResource(webResource);

        // log.debug({ title: 'stringToSign', details: stringToSign });
        // log.debug({ title: 'stringToSignwithn', details: stringToSign.replace(/\n/g, '\\n') });

        var signature = this.signer.sign(stringToSign);
        //log.debug({title : 'signature', details : signature });

        webResource.withHeader(HeaderConstants.AUTHORIZATION, 'SharedKey ' + this.storageAccount + ':' + signature);
        //callback(null);
      };
      /**
       * Constructs the Canonicalized Headers string.
       *
       * To construct the CanonicalizedHeaders portion of the signature string,
       * follow these steps: 1. Retrieve all headers for the resource that begin
       * with x-ms-, including the x-ms-date header. 2. Convert each HTTP header
       * name to lowercase. 3. Sort the headers lexicographically by header name,
       * in ascending order. Each header may appear only once in the
       * string. 4. Unfold the string by replacing any breaking white space with a
       * single space. 5. Trim any white space around the colon in the header. 6.
       * Finally, append a new line character to each canonicalized header in the
       * resulting list. Construct the CanonicalizedHeaders string by
       * concatenating all headers in this list into a single string.
       *
       * @param {object} The webresource object.
       * @return {string} The canonicalized headers.
       */
      this._getCanonicalizedHeaders = function (webResource) {
        // Build canonicalized headers
        var canonicalizedHeaders = '';
        if (webResource.headers) {
          var canonicalizedHeadersArray = [];
          for (var header in webResource.headers) {
            if (header.indexOf(HeaderConstants.PREFIX_FOR_STORAGE) === 0) {
              var headerItem = { canonicalized: header.toLowerCase(), original: header };
              canonicalizedHeadersArray.push(headerItem);
            }
          }

          canonicalizedHeadersArray.sort(function (a, b) { return a.canonicalized.localeCompare(b.canonicalized); });

          _.each(canonicalizedHeadersArray, function (currentHeaderItem) {
            var value = webResource.headers[currentHeaderItem.original];
            if (!azureutil.IsNullOrEmptyOrUndefinedOrWhiteSpace(value)) {
              canonicalizedHeaders += currentHeaderItem.canonicalized + ':' + value + '\n';
            } else {
              canonicalizedHeaders += currentHeaderItem.canonicalized + ':\n';
            }
          });
        }

        return canonicalizedHeaders;
      };

      /*
      * Retrieves the webresource's canonicalized resource string.
      * @param {WebResource} webResource The webresource to get the canonicalized resource string from.
      * @return {string} The canonicalized resource string.
      */
      this._getCanonicalizedResource = function (webResource) {
        var path = '/';
        if (webResource.path) {
          path = webResource.path;
        }

        var canonicalizedResource = '/' + this.storageAccount + path;

        // Get the raw query string values for signing
        var queryStringValues = webResource.queryString;

        // Build the canonicalized resource by sorting the values by name.
        if (queryStringValues) {
          var paramNames = [];
          Object.keys(queryStringValues).forEach(function (n) {
            paramNames.push(n);
          });

          paramNames = paramNames.sort();
          Object.keys(paramNames).forEach(function (name) {
            canonicalizedResource += '\n' + paramNames[name] + ':' + queryStringValues[paramNames[name]];
          });
        }

        return canonicalizedResource;
      };
    }

    /**
    * Creates a new HmacSHA256Sign object.
    *
    * @constructor
    */
    function HmacSha256Sign(accessKey) {
      this._accessKey = accessKey;
      //this._decodedAccessKey = Buffer.from(this._accessKey, 'base64');

      /**
      * Computes a signature for the specified string using the HMAC-SHA256 algorithm.
      *
      * @param {string} stringToSign The UTF-8-encoded string to sign.
      * @return A String that contains the HMAC-SHA256-encoded signature.
      */
      this.sign = function (stringToSign) {
        // Encoding the Signature
        // Signature=Base64(HMAC-SHA256(UTF8(StringToSign)))

        //return crypto.createHmac('sha256', this._decodedAccessKey).update(stringToSign, 'utf-8').digest('base64');

        var storageAccountKey = CryptoJS.enc.Base64.parse(this._accessKey);

        var hash = CryptoJS.HmacSHA256(stringToSign, storageAccountKey);
        var signature = CryptoJS.enc.Base64.stringify(hash);
        return signature;
      };
    }

    return SharedKey;

  });