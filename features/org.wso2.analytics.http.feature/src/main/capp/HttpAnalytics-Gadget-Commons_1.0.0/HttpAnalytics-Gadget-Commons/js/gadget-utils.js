/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This Javascript module groups utility methods that are being used by all the gadgets in the HTTP analytics dashboard
 */

var CONTEXT = "/http-analytics/api/as-data.jag";
var DASHBOARD_NAME = parent.ues.global.dashboard.id; //"http-analytics"
var BASE_URL = getDashboardBaseUrl();

var LANDING_PAGE = "landing";

var ROLE_TPS = "tps";
var ROLE_LATENCY = "latency";
var ROLE_RATE = "rate";

var PARAM_ID = "id";
var PARAM_TYPE = "type";
var PARAM_GADGET_ROLE = "role";

var COLOR_BLUE = "#438CAD";
var COLOR_RED = "#D9534F";
var COLOR_GREEN = "#5CB85C";

var PARENT_WINDOW = window.parent.document;
var PARAM_SHARED = "shared=true"

var ALL_APPLICATIONS_TEXT = 'All-Applications';

function getDashboardBaseUrl() {
    var currentUrl = window.parent.location.href;
    var BaseUrlRegex = new RegExp(".*?(portal.*dashboards)");
    var tenantBaseUrl = BaseUrlRegex.exec(currentUrl)[1];
    return "/" + tenantBaseUrl + "/" + DASHBOARD_NAME + "/";
}

function GadgetUtil() {
    var DEFAULT_START_TIME = new Date(moment().subtract(29, 'days')).getTime();
    var DEFAULT_END_TIME = new Date(moment()).getTime();

    this.getQueryString = function () {
        var queryStringKeyValue = window.parent.location.search.replace('?', '').split('&');
        var qsJsonObject = {};
        if (queryStringKeyValue != '') {
            for (i = 0; i < queryStringKeyValue.length; i++) {
                qsJsonObject[queryStringKeyValue[i].split('=')[0]] = queryStringKeyValue[i].split('=')[1];
            }
        }
        return qsJsonObject;

    };

    this.getChart = function (chartType) {
        var chart = null;
        charts.forEach(function (item, i) {
            if (item.name === chartType) {
                chart = item;
            }
        });
        return chart;
    };

    // method implementation should be improved once the meta data API is introduced in DS
    // https://wso2.org/jira/browse/UES-1036
    this.getCurrentPageName = function () {
        var pageName = $('#ues-pages ul li.active a', window.parent.document).html();
        if (!pageName) {
            return '';
        }
        return pageName;
    }

    this.getCurrentPageUrl = function () {
        var pageUrl;
        var href = parent.window.location.href;
        href = href.replace(/\/\?/, "?");
        var lastSegment = href.substr(href.lastIndexOf('/') + 1);
        if (lastSegment.indexOf('?') == -1) {
            pageUrl = lastSegment;
        } else {
            pageUrl = lastSegment.substr(0, lastSegment.indexOf('?'));
        }
        if (!pageUrl || pageUrl === DASHBOARD_NAME) {
            pageUrl = LANDING_PAGE;
        }
        return pageUrl;
    };

    this.getRequestType = function (pageName, chart) {
        chart.types.forEach(function (item, i) {
            if (item.name === pageName) {
                type = item.type;
            }
        });
        return type;
    };

    this.getGadgetConfig = function (typeName) {
        var config = null;
        configs.forEach(function (item, i) {
            if (item.name === typeName) {
                config = item;
            }
        });
        return config;
    };

    this.getCurrentPage = function () {
        var page, pageName;
        var href = parent.window.location.href;
        var lastSegment = href.substr(href.lastIndexOf('/') + 1);
        if (lastSegment.indexOf('?') == -1) {
            pageName = lastSegment;
        } else {
            pageName = lastSegment.substr(0, lastSegment.indexOf('?'));
        }
        return this.getGadgetConfig(pageName);
    };

    this.timeFrom = function () {
        var timeFrom = DEFAULT_START_TIME;
        var qs = this.getQueryString();
        if (qs.timeFrom != null) {
            timeFrom = qs.timeFrom;
        }
        return timeFrom;
    };

    this.timeTo = function () {
        var timeTo = DEFAULT_END_TIME;
        var qs = this.getQueryString();
        if (qs.timeTo != null) {
            timeTo = qs.timeTo;
        }
        return timeTo;
    };

    this.appName = function () {
        var qs = this.getQueryString();
        // skip if all applications is selected
        if (qs.webappName == null || qs.webappName == ALL_APPLICATIONS_TEXT) {
            return '';
        }
        return qs.webappName;
    }

    this.node = function () {
        return "All";
    }

    this.fetchData = function (context, params, callback, error) {
        var url = "?";

        // if the page is the landing page, remove appname selection
        if (this.getCurrentPageUrl() == LANDING_PAGE) {
            delete params.appname;
        }

        for (var param in params) {
            url = url + param + "=" + params[param] + "&";
        }
        console.debug("++ AJAX TO: " + context + url);
        $.ajax({
            url: context + url,
            type: "GET",
            dataType: "json",
            success: function (data) {
                callback(data);
            },
            error: function (msg) {
                error(msg);
            }
        });
    };

    this.getDefaultText = function () {
        return '<div class="status-message">' +
            '<div class="message message-info">' +
            '<h4><i class="icon fw fw-info"></i>No content to display</h4>' +
            '<p>Please select a date range to view stats.</p>' +
            '</div>' +
            '</div>';
    };

    this.getEmptyRecordsText = function () {
        return '<div class="status-message">' +
            '<div class="message message-info">' +
            '<h4><i class="icon fw fw-info"></i>No records found</h4>' +
            '<p>Please select a date range to view stats.</p>' +
            '</div>' +
            '</div>';
    };

    this.getErrorText = function (msg) {
        return '<div class="status-message">' +
            '<div class="message message-danger">' +
            '<h4><i class="icon fw fw-info"></i>Error</h4>' +
            '<p>An error occured while attempting to display this gadget. Error message is: ' + msg.status + ' - ' + msg.statusText + '</p>' +
            '</div>' +
            '</div>';
    };

    this.getNoValidCountryDataText = function () {
        return '<div class="status-message">' +
            '<div class="message message-info">' +
            '<h4><i class="icon fw fw-info"></i>No valid data found for the country statistics</h4>' +
            '<p>Most probably the MaxMind GeoLite2 Country database is not present at <WSO2_ANALYTICS_HOME>/repository/resources/. Please refer the HTTP Analytics documentation for more ' +
            'information on how to enable geo location analytics.</p>' +
            '</div>' +
            '</div>';
    };

    this.getCookie = function (cname) {
        var name = cname + "=";
        var ca = parent.document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    };

    this.getGadgetWrapper = function () {
        return $('#' + gadgets.rpc.RPC_ID, PARENT_WINDOW).closest('.gadget-body');
    };

    this.getGadgetParentWrapper = function () {
        return $('#' + gadgets.rpc.RPC_ID, PARENT_WINDOW).closest('.ues-component-box');
    };

    this.getView = function () {
        if ($('#' + gadgets.rpc.RPC_ID, PARENT_WINDOW).closest('.grid-stack-item').hasClass('ues-component-fullview')) {
            return 'maximized';
        }
        else {
            return 'minimized';
        }
    };

    this.getUrlParameters = function () {
        var currentUrl = parent.window.location.href;
        var urlParametersRegex = new RegExp(".*?(\\?.*)");
        var urlParameters = "";
        var parameters = urlParametersRegex.exec(currentUrl);
        if (parameters != null && parameters.length > 1) {
            urlParameters = parameters[1];
            return urlParameters;
        }
        return null;
    };

    this.removeUrlParam = function (id) {
        var urlParameters = this.getUrlParameters();
        if (urlParameters != null && urlParameters[id]) {
            return this.getUrlParameters().replace(new RegExp('(' + id + '=)[^\\&]+'), '');
        }
        return '';
    }

    this.isSharedDashboard = function () {
        var href = parent.window.location.href;
        return href.includes(PARAM_SHARED);
    }
}

var gadgetUtil = new GadgetUtil();

function mediaScreenSize() {
    var windowWidth = $(window).width();
    if (windowWidth < 767) {
        $('body').attr('media-screen', 'xs');
    }
    if ((windowWidth > 768) && (windowWidth < 991)) {
        $('body').attr('media-screen', 'sm');
    }
    if ((windowWidth > 992) && (windowWidth < 1199)) {
        $('body').attr('media-screen', 'md');
    }
    if (windowWidth > 1200) {
        $('body').attr('media-screen', 'lg');
    }
}

// Light/Dark Theme Switcher
$(document).ready(function () {

    $(gadgetUtil.getGadgetWrapper()).addClass('loading');

    if ((gadgetUtil.getCookie('dashboardTheme') == 'dark') || gadgetUtil.getCookie('dashboardTheme') == '') {
        $('body').addClass('dark');
    }
    else {
        $('body').removeClass('dark');
    }

    if (typeof $.fn.nanoScroller == 'function') {
        $(".nano").nanoScroller();
    }

    mediaScreenSize();

});

var readyInterval = setInterval(function () {
    if (document.readyState == "complete") {
        $(gadgetUtil.getGadgetWrapper()).removeClass('loading');
        clearInterval(readyInterval);
    }
}, 100);

$(window).resize(function () {
    mediaScreenSize();
});
