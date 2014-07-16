/**
 * Created by a2014 on 14-7-16.
 */

var isFunction = function (a) {
    return a && Object.prototype.toString.call(a) == '[object Array]';
}

var isObject = function (a) {
    return a && Object.prototype.toString.call(a) == '[object Object]';
}


exports.util = {
    isFunc: isFunction,
    isObj: isObject
}