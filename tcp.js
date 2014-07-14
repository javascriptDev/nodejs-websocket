/**
 * Created by a2014 on 14-7-14.
 */
var net=require('net');

var s=net.createServer(function (sock) {
    sock.setEncoding('utf8');

    var body = "";
    sock.on('data', function (data) {
        console.log(data.toString());
    });
    console.dir('connect');

    sock.on('end', function() {
        console.log('end');

    });

    // TODO error handling here
});
s.listen(8889,'localhost',function(){
    console.log('server is begin');
})

