/**
  * @alova/mock 2.0.20 (https://github.com/alovajs/mock)
  * Document https://github.com/alovajs/mock
  * Copyright 2026 Scott Hu. All Rights Reserved
  * Licensed under MIT (git://github.com/alovajs/alova/blob/main/LICENSE)
*/

import { isSpecialRequestBody, isString, falseValue, trueValue, undefinedValue, isFn, usePromise, newInstance, promiseResolve, isNumber, promiseReject, globalToString } from '@alova/shared';

// Predefined styles and fixed text
const mockLabel = 'mock';
const mockLabelColor = '#64bde8';
const mockLabelBg = '#ccefff';
const realRequestLabel = 'Realtime';
const realRequestLabelColor = '#999999';
const realRequestLabelBg = '#ededed';
const labelStyle = (bgColor, color) => `padding: 2px 6px; background: ${bgColor}; color: ${color};`;
const titleStyle = 'color: black; font-size: 12px; font-weight: bolder';
const transform2TableData = (obj) => {
    const tableData = {};
    for (const key in obj) {
        tableData[key] = { value: obj[key] };
    }
    return tableData;
};
// Print request information, dedicated to simulated data requests
const consoleRequestInfo = ({ isMock, url, method, headers, query, data, responseHeaders, response }) => {
    const cole = console;
    cole.groupCollapsed(`%c${isMock ? mockLabel : realRequestLabel}`, labelStyle(isMock ? mockLabelBg : realRequestLabelBg, isMock ? mockLabelColor : realRequestLabelColor), url);
    // Request method
    cole.log('%c[Method]', titleStyle, method.toUpperCase());
    // OutputRequestHeaders
    cole.log('%c[Request Headers]', titleStyle);
    cole.table(transform2TableData(headers));
    // 输出Query String Parameters
    cole.log('%c[Query String Parameters]', titleStyle);
    cole.table(transform2TableData(query));
    // Output request body
    cole.log('%c[Request Body]', titleStyle, data || '');
    // Output response body
    if (isMock) {
        // When the response header has data, output Response Headers
        if (Object.keys(responseHeaders).length > 0) {
            cole.log('%c[Response Headers]', titleStyle);
            cole.table(transform2TableData(responseHeaders));
        }
        cole.log('%c[Response Body]', titleStyle, response || '');
    }
    cole.groupEnd();
};

/**
 * The default response data interceptor and returns Response data
 */
const defaultMockResponse = ({ status = 200, responseHeaders, statusText = 'ok', body }) => {
    const response = new Response(isSpecialRequestBody(body) ? body : JSON.stringify(body), {
        status,
        statusText,
        headers: responseHeaders
    });
    return {
        response,
        headers: response.headers
    };
};
/**
 * Return the error message itself
 * @param error error message
 * @returns itself
 */
const defaultMockError = (error) => error;

/**
 * Parse query string to object
 * @param queryString query string (e.g. "a=1&b=2")
 * @returns Parsed key-value object
 */
const parseQueryString = (queryString) => {
    const query = {};
    queryString.split('&').forEach(paramItem => {
        const [key, value] = paramItem.split('=');
        key && (query[key] = value);
    });
    return query;
};
/**
 * parse url
 * @param url url
 * @returns Parsed information object
 */
const parseUrl = (url) => {
    url = /^[^/]*\/\//.test(url) ? url : `//${url}`;
    const splitedFullPath = url.split('/').slice(3);
    const query = {};
    let pathContainedParams = splitedFullPath.pop();
    let pathname = '';
    let hash = '';
    if (pathContainedParams) {
        pathContainedParams = pathContainedParams.replace(/\?[^?#]+/, mat => {
            // Parse url parameters
            Object.assign(query, parseQueryString(mat.substring(1)));
            return '';
        });
        pathContainedParams = pathContainedParams.replace(/#[^#]*/, mat => {
            hash = mat;
            return '';
        });
        splitedFullPath.push(pathContainedParams);
        pathname = `/${splitedFullPath.join('/')}`;
    }
    return {
        pathname,
        query,
        hash
    };
};

function MockRequest({ 
// This enable is the main switch
enable = trueValue, delay = 2000, httpAdapter, mockRequestLogger = consoleRequestInfo, mock, onMockResponse = defaultMockResponse, onMockError = defaultMockError, matchMode = 'pathname' } = { mock: {} }) {
    // Normalize the logger: true uses default consoleRequestInfo, false or undefined disables logging
    const resolvedMockRequestLogger = mockRequestLogger === trueValue ? consoleRequestInfo : mockRequestLogger;
    return (elements, method) => {
        // Get the simulation data collection of the current request. If enable is false, no simulation data will be returned.
        mock = (enable && mock) || {};
        const { url, data, type, headers: requestHeaders } = elements;
        let pathname = method.url;
        const paramsConfig = method.config.params;
        let query = isString(paramsConfig) ? parseQueryString(paramsConfig) : paramsConfig || {};
        if (matchMode === 'pathname') {
            const parsedUrl = parseUrl(url);
            pathname = parsedUrl.pathname;
            query = parsedUrl.query;
        }
        const params = {};
        const pathnameSplited = pathname.split('/');
        const foundMockDataKeys = Object.keys(mock).filter(key => {
            // If the key is preceded by , it means that this simulation data is ignored, and false is also returned at this time.
            if (key.startsWith('-')) {
                return falseValue;
            }
            // Match request method
            let methodType = 'GET';
            key = key.replace(/^\[(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\]/i, (_, $1) => {
                methodType = $1.toUpperCase();
                return '';
            });
            // The request method does not match and returns false.
            if (methodType !== type.toUpperCase()) {
                return falseValue;
            }
            const keySplited = key.split('/');
            if (keySplited.length !== pathnameSplited.length) {
                return falseValue;
            }
            // Determine whether the path matches by matching with the same subscript
            // If a wildcard is encountered, pass it directly
            for (let i = 0; i < keySplited.length; i += 1) {
                const keySplitedItem = keySplited[i];
                const matchedParamKey = (keySplitedItem.match(/^\{(.*)\}$/) || ['', ''])[1];
                if (!matchedParamKey) {
                    if (keySplitedItem !== pathnameSplited[i]) {
                        return falseValue;
                    }
                }
                else {
                    params[matchedParamKey] = pathnameSplited[i];
                }
            }
            return trueValue;
        });
        // If there are multiple matches, the one without wildcards will be used first. If there are both wildcards, the first matched one will be used.
        let finalKey = foundMockDataKeys.find(key => !/\{.*\}/.test(key));
        finalKey = finalKey || foundMockDataKeys.shift();
        const mockDataRaw = finalKey ? mock[finalKey] : undefinedValue;
        // If no simulated data is matched, it means that a request is to be initiated and the http adapter is used to send the request.
        if (mockDataRaw === undefinedValue) {
            if (httpAdapter) {
                isFn(resolvedMockRequestLogger) &&
                    resolvedMockRequestLogger({
                        isMock: falseValue,
                        url,
                        method: type,
                        params,
                        headers: requestHeaders,
                        query,
                        data: {},
                        responseHeaders: {}
                    });
                return httpAdapter(elements, method);
            }
            throw new Error(`cannot find the httpAdapter.\n[url]${url}`);
        }
        const promiseResolver = usePromise();
        const { resolve } = promiseResolver;
        let { promise: resonpsePromise, reject } = promiseResolver;
        const timeout = method.config.timeout || 0;
        if (timeout > 0) {
            setTimeout(() => {
                reject(new Error('request timeout'));
            }, timeout);
        }
        const timer = setTimeout(() => {
            // Response supports returning promise objects
            try {
                const res = isFn(mockDataRaw)
                    ? mockDataRaw({
                        query,
                        params,
                        data: isString(data)
                            ? (() => {
                                try {
                                    return JSON.parse(data);
                                }
                                catch (_a) {
                                    return data;
                                }
                            })()
                            : data || {},
                        headers: requestHeaders
                    })
                    : mockDataRaw;
                // This code means that the internal reject is assigned to the outside, and if the timeout occurs, the reject is triggered immediately, or waits for res (if res is a promise) to resolve
                resolve(newInstance((Promise), (resolveInner, rejectInner) => {
                    reject = rejectInner;
                    promiseResolve(res).then(resolveInner).catch(rejectInner);
                }));
            }
            catch (error) {
                reject(error);
            }
        }, delay);
        let isOnMockResponseError = falseValue;
        resonpsePromise = resonpsePromise
            .then((response) => {
            let status = 200;
            let statusText = 'ok';
            let responseHeaders = {};
            let body = undefinedValue;
            // If there is no return value, it is considered 404
            if (response === undefinedValue) {
                status = 404;
                statusText = 'api not found';
            }
            else if (response && isNumber(response.status) && isString(response.statusText)) {
                // Returned a custom status code and status text as the response message
                status = response.status;
                statusText = response.statusText;
                responseHeaders = response.responseHeaders || responseHeaders;
                body = response.body;
            }
            else {
                // Otherwise, use response directly as response data
                body = response;
            }
            isOnMockResponseError = trueValue;
            return Promise.all([
                onMockResponse({ status, statusText, responseHeaders, body }, {
                    headers: requestHeaders,
                    query,
                    params,
                    data: data || {}
                }, method),
                responseHeaders
            ]).then(([response, responseHeaders]) => {
                // Print simulation data request information
                isFn(resolvedMockRequestLogger) &&
                    resolvedMockRequestLogger({
                        isMock: trueValue,
                        url,
                        method: type,
                        params,
                        headers: requestHeaders,
                        query,
                        data: data || {},
                        responseHeaders,
                        response: body
                    });
                return response;
            });
        })
            .catch(error => {
            if (isOnMockResponseError) {
                return promiseReject(error);
            }
            return promiseReject(onMockError(error, method));
        });
        // Return response data
        return {
            response: () => resonpsePromise.then(({ response }) => response && globalToString(response) === '[object Response]' ? response.clone() : response),
            headers: () => resonpsePromise.then(({ headers }) => headers),
            abort: () => {
                clearTimeout(timer);
                reject(new Error('The user abort request'));
            }
        };
    };
}

/**
 * Create alova mock data request adapter
 * @param baseURL The simulated base URL, used for namespace use, is consistent with the baseURL parameter of the createAlova function.
 * @returns Create a mock definer
 */
function createAlovaMockAdapter(mockWrapper, options = { enable: true }) {
    let uniqueMockMap = {};
    mockWrapper
        .filter(({ enable }) => enable)
        .forEach(({ data }) => {
        uniqueMockMap = {
            ...data,
            ...uniqueMockMap
        };
    });
    return MockRequest({
        ...options,
        mock: uniqueMockMap
    });
}

/**
 * Define simulation data
 * @param mock Simulated data collection, which can be a function or data. If it is a function, it will receive a parameter containing three attributes: query, params, and data, which represent query parameters, path parameters, and request body data respectively.
 * @param enable Whether to use this simulation data collection, the default is true
 */
var defineMock = (mock, enable = true) => ({
    enable,
    data: mock
});

export { createAlovaMockAdapter, defineMock };
