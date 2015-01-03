"use strict";

// Core packages
var url = require('url');

// npm Packages
var request = require('request');

// Custom packages
var oauth_util = require('./lib/oauth_util');
var errorStrings = require('./lib/error');

/**
 * Represents a client for the Jira REST API
 *
 * @constructor
 * @param config The information needed to access the Jira API
 * @param {string} host The hostname of the Jira API.
 * @param {string} [config.protocol=https] The protocol used to accses the Jira API.
 * @param {number} [config.port=443] The port number used to connect to Jira.
 * @param {string} [config.version=2] The version of the Jira API to which you will be connecting.  Currently, only version 2 is supported.
 * @param config.auth The authentication information used tp connect to Jira. Must contain EITHER username and password OR oauth information.  Oauth information will be
 *        used over username/password authentication.
 * @param {string} [config.basic_auth.username] The username of the user that will be authenticated. MUST be included if using username and password authentication.
 * @param {string} [config.basic_auth.password] The password of the user that will be authenticated. MUST be included if using username and password authentication.
 * @param {string} [config.oauth.consumer_key] The consumer key used in the Jira Application Link for oauth authentication.  MUST be included if using OAuth.
 * @param {string} [config.oauth.private_key] The private key used for OAuth security. MUST be included if using OAuth.
 * @param {string} [config.oauth.token] The VERIFIED token used to connect to the Jira API.  MUST be included if using OAuth.
 * @param {string} [config.oauth.token_secret] The secret for the above token.  MUST be included if using Oauth.
 */
var JiraClient = module.exports = function (config) {
    if(!config.host) {
        throw new Error(errorStrings.NO_HOST_ERROR);
    }
    this.host = config.host;
    this.protocol = config.protocol ? config.protocol : 'https';
    this.port = config.port;
    this.version = 2; // TODO Add support for other versions.

    if (!config.oauth && !config.basic_auth) {
        throw new Error(errorStrings.NO_AUTHENTICATION_ERROR);
    }

    if (config.oauth) {
        if (!config.oauth.consumer_key) {
            throw new Error(errorStrings.NO_CONSUMER_KEY_ERROR);
        } else if (!config.oauth.private_key) {
            throw new Error(errorStrings.NO_PRIVATE_KEY_ERROR);
        } else if (!config.oauth.token) {
            throw new Error(errorStrings.NO_OAUTH_TOKEN_ERROR);
        } else if (!config.oauth.token_secret) {
            throw new Error(errorStrings.NO_OAUTH_TOKEN_SECRET_ERROR);
        }

        this.oauthConfig = config.oauth;
        this.oauthConfig.signature_method = 'RSA-SHA1';

    } else if (config.basic_auth) {
        if (!config.basic_auth.username) {
            throw new Error(errorStrings.NO_USERNAME_ERROR);
        } else if (!config.basic_auth.password) {
            throw new Error(errorStrings.NO_PASSWORD_ERROR);
        }

        this.basic_auth = {
            user: config.basic_auth.username,
            pass: config.basic_auth.password
        };

    } else {
        throw new Error(errorStrings.INVALID_AUTHENTICATION_PROPERTY_ERROR);
    }

    var issue = require('./api/issue');
    this.issue = new issue(this);
};

(function () {

    this.buildURL = function (path) {
        var apiBasePath = 'rest/api/';
        var version = this.version;
        var requestUrl = url.format({
            protocol: this.protocol,
            hostname: this.host,
            port: this.port,
            pathname: apiBasePath + version + path
        });

        return decodeURIComponent(requestUrl);
    };

    this.makeRequest = function (options, callback) {
        if (this.oauthConfig) {
            options.oauth = this.oauthConfig;
        } else if (this.basic_auth) {
            options.auth = this.basic_auth;
        } else {
            callback(errorStrings.NO_AUTHENTICATION_ERROR);
        }
        request(options, callback);
    };

}).call(JiraClient.prototype);

JiraClient.oauth_util = require('./lib/oauth_util');

exports.oauth_util = oauth_util;

