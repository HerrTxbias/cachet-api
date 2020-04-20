var util = require('util');
var request = require('request');
var Promise = require('bluebird');
var statusCodes = require('./util/statusCodes');

// Internal package configuration
var config = {
    // Supported Cachet API version
    apiVersion: 1
};

// Package constructor
function CachetAPI(options) {
    // Make sure the developer provided the status page URL
    if (!options.url) {
        throw new Error('Please provide your Cachet API endpoint URL to use this package.');
    }

    // Make sure the developer provided the Cachet API key
    if (!options.apiKey) {
        throw new Error('Please provide your API key to use this package.');
    }

    // Add trailing slash if ommitted in status page URL
    if (options.url.substr(-1) !== '/') {
        options.url += '/';
    }

    // Append api/v1 to the URL
    options.url += 'api/v' + config.apiVersion;

    // Keep track of URL for later
    this.url = options.url;

    // Prepare extra headers to be sent with all API requests
    this.headers = {
        // Cachet API authentication header
        'X-Cachet-Token': options.apiKey
    };
}

function parseFilter(filter) {
    return Object.keys(filter).map(function(param, idx) {
        var queryParam = param + '=' + filter[param];
        return idx === 0 ? '?' + queryParam : queryParam;
    }).join('&');
}

CachetAPI.prototype.publishMetricPoint = function(metricPoint) {
    // Dirty hack
    var that = this;

    // Return a promise
    return new Promise(function(resolve, reject) {
        // No metric point provided?
        if (!metricPoint) {
            return reject(new Error('Please provide the metric point to publish.'));
        }

        // Point must be an object
        if (typeof metricPoint !== 'object') {
            return reject(new Error('Please provide the metric point as an object.'));
        }

        // Check for missing metric ID
        if (!metricPoint.id) {
            return reject(new Error('Please provide the metric ID.'));
        }

        // Check for missing metric value
        if (metricPoint.value === null) {
            return reject(new Error('Please provide the metric point value.'));
        }

        // Prepare API request
        var req = {
            method: 'POST',
            json: metricPoint,
            headers: that.headers,
            url: that.url + '/metrics/' + metricPoint.id + '/points'
        };

        // Execute request
        request(req, function(err, res, body) {
            // Handle the response accordingly
            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.reportIncident = function(incident) {
    // Dirty hack
    var that = this;

    // Return a promise
    return new Promise(function(resolve, reject) {
        // No incident provided?
        if (!incident) {
            return reject(new Error('Please provide the incident to report.'));
        }

        // Incident must be an object
        if (typeof incident !== 'object') {
            return reject(new Error('Please provide the incident as an object.'));
        }

        // Check for required parameters
        if (!incident.name || !incident.message || !incident.status || !incident.visible) {
            return reject(new Error('Please provide the incident name, message, status, and visibility.'));
        }

        // Convert boolean values to integers
        incident.notify = incident.notify ? 1 : 0;
        incident.visible = incident.visible ? 1 : 0;

        try {
            // Attempt to convert incident status name to code
            incident.status = statusCodes.getIncidentStatusCode(incident.status);

            // Incident status provided?
            if (incident.component_status) {
                // Attempt to convert component status name to code
                incident.component_status = statusCodes.getComponentStatusCode(incident.component_status);
            }
        } catch (err) {
            // Bad status provided
            return reject(err);
        }

        // Prepare API request
        var req = {
            method: 'POST',
            json: incident,
            headers: that.headers,
            url: that.url + '/incidents'
        };

        // Execute request
        request(req, function(err, res, body) {
            // Handle the response accordingly
            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.getComponentById = function(id) {
    // Dirty hack
    var that = this;

    // Return a promise
    return new Promise(function(resolve, reject) {
        // No component ID provided?
        if (!id) {
            return reject(new Error('Please provide the component ID to fetch.'));
        }

        // Prepare API request
        var req = {
            method: 'GET',
            json: true,
            headers: that.headers,
            url: that.url + '/components/' + id + '?t=' + new Date().getTime()
        };

        // Execute request
        request(req, function(err, res, body) {
            // Extract data object from body if it exists
            body = (body && body.data) ? body.data : body;

            // Handle the response accordingly
            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.updateIncident = function(incident) {
    // Dirty hack
    var that = this;

    // Return a promise
    return new Promise(function(resolve, reject) {
        // No incident provided?
        if (!incident) {
            return reject(new Error('Please provide the incident to report.'));
        }

        // Incident must be an object
        if (typeof incident !== 'object') {
            return reject(new Error('Please provide the incident as an object.'));
        }

        // Check for required parameters
        if (!incident.id || !incident.status || !incident.message) {
            return reject(new Error('Please provide the incident id, message and status.'));
        }

        // Prepare API request
        var req = {
            method: 'PUT',
            json: true,
            headers: that.headers,
            body: incident,
            url: that.url + '/incidents/' + incident.id
        };

        // Execute request
        request(req, function(err, res, body) {
            // Handle the response accordingly
            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.updateComponent = function(component) {
    // Dirty hack
    var that = this;

    // Return a promise
    return new Promise(function(resolve, reject) {
        // No component provided?
        if (!component) {
            return reject(new Error('Please provide the component to report.'));
        }

        // Component must be an object
        if (typeof component !== 'object') {
            return reject(new Error('Please provide the component as an object.'));
        }

        // Check for required parameters
        if (!component.id || !component.status) {
            return reject(new Error('Please provide the incident id and status.'));
        }

        // Prepare API request
        var req = {
            method: 'PUT',
            json: true,
            headers: that.headers,
            body: component,
            url: that.url + '/components/' + component.id
        };

        // Execute request
        request(req, function(err, res, body) {
            // Handle the response accordingly
            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.getIncidents = function(filter) {
    // Dirty hack
    var that = this;

    // Return a promise
    return new Promise(function(resolve, reject) {
        // Prepare API request
        var req = {
            method: 'GET',
            json: true,
            headers: that.headers,
            url: that.url + '/incidents' + parseFilter(filter),
            strictSSL: false,
            rejectUnauthorized: false
        };

        // Execute request
        request(req, function(err, res, body) {
            // Extract data object from body if it exists
            body = (body && body.data) ? body.data : body;

            // Handle the response accordingly
            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.getComponents = function(filter){
    // Dirty hack
    var that = this;

    return new Promise(function(resolve, reject) {
        var req = {
            method: 'GET',
            json: true,
            headers: that.headers,
            url: `${that.url}/components` + parseFilter(filter),
            strictSSL: false,
            rejectUnauthorized: false
        };

        request(req, function(err, res, body) {
            body = (body && body.data) ? body.data : body;

            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.getComponentGroups = function(filter){
    // Dirty hack
    var that = this;

    return new Promise(function(resolve, reject) {
        var req = {
            method: 'GET',
            json: true,
            headers: that.headers,
            url: `${that.url}/components/groups` + parseFilter(filter),
            strictSSL: false,
            rejectUnauthorized: false
        };

        request(req, function(err, res, body) {
            body = (body && body.data) ? body.data : body;

            handleResponse(err, res, body, reject, resolve);
        });
    });
};

CachetAPI.prototype.getVersion = function(){
    // Dirty hack
    var that = this;

    return new Promise(function(resolve, reject) {
        var req = {
            method: 'GET',
            json: true,
            headers: that.headers,
            url: `${that.url}/version`,
            strictSSL: false,
            rejectUnauthorized: false
        };

        request(req, function(err, res, body) {
            body = (body && body.data) ? body.data : body;

            handleResponse(err, res, body, reject, resolve);
        });
    });
};

function handleResponse(err, res, body, reject, resolve) {
    // Handle errors by rejecting the promise
    if (err) {
        return reject(err);
    }

    // Error(s) returned?
    if (body.errors) {
        // Stringify and reject promise
        return reject(new Error(util.inspect(body.errors)));
    }

    // Require 200 OK for success
    if (res.statusCode != 200) {
        // Throw generic error
        return reject(new Error('An invalid response code was returned from the API: ' + res.statusCode));
    }

    // Resolve promise with request body
    resolve(body);
}

// Expose the class object
module.exports = CachetAPI;
