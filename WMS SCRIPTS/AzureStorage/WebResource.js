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
define(['./constants.js', './util.js'],
  /**
    * Module params:
    */
  function (Constants, azureutil) {

    var HttpConstants = Constants.HttpConstants;

    function encodeSpecialCharacters(path) {
      return path.replace(/'/g, '%27');
    }
    /**
    * Creates a new WebResource object.
    *
    * This class provides an abstraction over a REST call by being library / implementation agnostic and wrapping the necessary
    * properties to initiate a request.
    *
    * @constructor
    */
    function WebResource() {
      this.rawResponse = false;
      this.queryString = {};
      //this.headers = {};

      /**
      * Creates a new put request web resource.
      *
      * @param {string} path The path for the put operation.
      * @return {WebResource} A new webresource with a put operation for the given path.
      */
      this.get = function (path) {
        var webResource = new WebResource();
        webResource.path = path ? encodeSpecialCharacters(path) : null;
        webResource.method = HttpConstants.HttpVerbs.GET;
        return webResource;
      };
      this.put = function (path) {
        var webResource = new WebResource();
        webResource.path = path ? encodeSpecialCharacters(path) : null;
        webResource.method = HttpConstants.HttpVerbs.PUT;
        return webResource;
      };
      this.post = function (path) {
        var webResource = new WebResource();
        webResource.path = path ? encodeSpecialCharacters(path) : null;
        webResource.method = HttpConstants.HttpVerbs.POST;
        return webResource;
      };
      this.del = function (path) {
        var webResource = new WebResource();
        webResource.path = path ? encodeSpecialCharacters(path) : null;
        webResource.method = HttpConstants.HttpVerbs.DELETE;
        return webResource;
      };
      /**
      * Adds an optional header parameter.
      *
      * @param {Object} name  The name of the header parameter.
      * @param {Object} value The value of the header parameter.
      * @return {Object} The web resource.
      */
      this.withHeader = function (name, value) {
        if (!this.headers) {
          this.headers = {};
        }

        if (!azureutil.IsNullOrEmptyOrUndefinedOrWhiteSpace(value)) {
          value = value instanceof Date ? value.toUTCString() : value;

          this.headers[name] = value;
        }

        return this;
      };
      /**
      * Adds optional query string parameters.
      *
      * Additional arguments will be the needles to search in the haystack. 
      *
      * @param {Object} object  The haystack of headers.
      * @return {Object} The web resource.
      */
      this.withHeaders = function (object) {
        if (object) {
          for (var i = 1; i < arguments.length; i++) {
            if (object[arguments[i]]) {
              this.withHeader(arguments[i], object[arguments[i]]);
            }
          }
        }

        return this;
      };

      /**
      * Adds an optional query string parameter.
      *
      * @param {Object} name          The name of the query string parameter.
      * @param {Object} value         The value of the query string parameter.
      * @param {Object} defaultValue  The default value for the query string parameter to be used if no value is passed.
      * @return {Object} The web resource.
      */
      this.withQueryOption = function (name, value, defaultValue) {
        if (!azureutil.objectIsNull(value)) {
          this.queryString[name] = value;
        } else if (defaultValue) {
          this.queryString[name] = defaultValue;
        }

        return this;
      };
    }

    return new WebResource();

  });