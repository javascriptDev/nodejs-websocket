
/**
 * Created by a2014 on 14-7-16.
 */

var http = require('http');
var staticFile = require('./staticFile').sf;


Math.uuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
var srv = http.createServer(function (req, res) {
    staticFile(req, res);
    //如果没有cookie 或者 cookie内不包含_id
//    if (!req.headers.cookie || req.headers.cookie.indexOf('_id') == -1) {
//        console.log('set cookie');
//        var id = Math.uuid();
//        req.id = id;
//        res.setHeader("Set-Cookie", '_id=' + id);
//    }
});


srv.listen(1337, function () {
    console.log('static file server is begin');
})
