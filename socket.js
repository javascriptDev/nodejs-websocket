var net = require('net');
var crypto = require('crypto'),
    md5 = crypto.createHash('md5');
var so=[];
var server = net.createServer(function (c) { //'connection' listener
    so.push(c);
    console.log('server connected');
    c.on('end', function () {
        console.log('server disconnected');
    });

    c.on('connect', function () {
        console.log('connect');
    })

    function build_msg( str_msg, mask ){
        str_msg = str_msg || "";
        mask = mask || false;

        var msg_len = Buffer.byteLength(str_msg,"utf-8"), packed_data;
        if( msg_len <= 0 ){
            return null;
        }

        if( msg_len < 126 ){
            packed_data = new Buffer(2+msg_len);
            packed_data[0] = 0x81;
            packed_data[1] = msg_len;
            packed_data.write( str_msg, 2 );
        }else if( msg_len <= 0xFFFF ){//用16位表示数据长度
            packed_data = new Buffer(4 + msg_len);
            packed_data[0] = 0x81;
            packed_data[1] = 126;
            packed_data.writeUInt16BE( msg_len, 2 );
            packed_data.write( str_msg, 4 );
        }else{//用64位表示数据长度
            /*packed_data = new Buffer(10+msg_len);
             packed_data[0] = 0x81;
             packed_data[1] = 127;
             packed_data.writeUInt32BE(msg_len & 0xFFFF0000 >> 32, 2);
             packed_data.writeUInt32BE(msg_len & 0xFFFF, 6);
             packed_data.write( str_msg, 10 );*/
        }

        return packed_data;
    }
    function parse_msg(data){
        data = data || null;
        if( ( data.length <= 0 ) || ( !Buffer.isBuffer(data) ) ){
            return null;
        }

        var mask_flag = (data[1] & 0x80 == 0x80) ? 1 : 0;//All frames sent from client to server have this bit set to 1.
        var payload_len = data[1] & 0x7F;//0111 1111

        if( payload_len == 126 ){
            masks = data.slice(4,8);
            payload_data = data.slice(8);
            payload_len = data.readUInt16BE(2);
        }else if( payload_len == 127 ){
            masks = data.slice(10,14);
            payload_data = data.slice(14);
            payload_len = data.readUInt32BE(2) * Math.pow(2,32) + data.readUInt32BE(6);
        }else{
            masks = data.slice(2,6);
            payload_data = data.slice(6);
        }
        //console.log(payload_len);
        //console.log(payload_data.length);
        for( var i=0;i< payload_len;i++ ){
            payload_data[i]= payload_data[i] ^ masks[i%4];
        }

        return payload_data;
    }
    //var key= c.headers['sec-websocket-key'];
    // console.dir(c);
    //   console.log(key);

    c.on('data', function (data) {

        var aa = data.toString();

        var a = aa.split(':');
        if(a.length>1){
            var key = a[a.length - 2].replace('Sec-WebSocket-Extensions', '').replace(/(^\s+)|(\s+$)/g, '');
            var shasum = crypto.createHash('sha1');
            shasum.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
            key = shasum.digest('base64');

            var headers = [
                'HTTP/1.1 101 Switching Protocols',
                'Upgrade: WebSocket',
                'Connection: Upgrade',
                    'Sec-WebSocket-Accept:' + key
            ];
            var s = headers.concat('', '').join('\r\n');
            c.write(s);
        }else{
           var aaa = build_msg('asdasd');


          so.forEach(function(item){
              item.write(aaa);
          })
        }

    })


});
server.listen(8888, function () { //'listening' listener
    console.log('server bound');
});