/**
 * Created by a2014 on 14-7-15.
 */
var http = require('http');
var util = require('./util').util;

var crypto = require('crypto'),
    md5 = crypto.createHash('md5');


var msgType = {
    login: 'login',
    msg: 'msg',
    initFriend: 'initFriend',
    close: 'close'
}

Math.uuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// Create an HTTP server
var so = [];
var ids = [];

function buildSendMsg(str_msg, mask) {
    str_msg = str_msg || "";
    mask = mask || false;

    var msg_len = Buffer.byteLength(str_msg, "utf-8"), packed_data;

    if (msg_len <= 0) {
        return null;
    }

    if (msg_len < 126) {//默认全是数据
        packed_data = new Buffer(2 + msg_len);
        packed_data[0] = 0x81; // 1000(fin RSV1 RSV2 RSV3)   0001(opcode 1 text)
        packed_data[1] = msg_len;
        packed_data.write(str_msg, 2);
    } else if (msg_len <= 0xFFFF) {//用16位表示数据长度
        packed_data = new Buffer(4 + msg_len);
        packed_data[0] = 0x81;
        packed_data[1] = 126;
        packed_data.writeUInt16BE(msg_len, 2); //从第二位开始写
        packed_data.write(str_msg, 4);
    }

    return packed_data;
}


var websocket = http.createServer(function (req, res) {

});

websocket.on('upgrade', function (req, socket, head) {
    console.log('connect');
//    console.dir(socket);
    var key = req.headers['sec-websocket-key'].replace(/(^\s+)|(\s+$)/g, '');
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
    socket.write(s);
    socket.on('end', function () {
        console.log('disconnect');
    });
    var targetSocket = [];
    socket.on('data', function (data) {
        targetSocket.length = 0;
//            0                   1                   2                   3
//            0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
//            +-+-+-+-+-------+-+-------------+-------------------------------+
//            |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
//            |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
//            |N|V|V|V|       |S|             |   (if payload len==126/127)   |
//            | |1|2|3|       |K|             |                               |
//            +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
//            |     Extended payload length continued, if payload len == 127  |
//            + - - - - - - - - - - - - - - - +-------------------------------+
//            |                               |Masking-key, if MASK set to 1  |
//            +-------------------------------+-------------------------------+
//            | Masking-key (continued)       |          Payload Data         |
//            +-------------------------------- - - - - - - - - - - - - - - - +
//            :                     Payload Data continued ...                :
//            + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
//            |                     Payload Data continued ...                |
//            +---------------------------------------------------------------+


        var opCode = data[0] & 0xf; //取后四位 1111 按位与
        if (opCode == 1) {//文字
            var payloadLen = data[1] & 0x7f; // 0111 1111 取第二个字节的后7位

            var mask;
            var payLoadData;
            //payloadlen 7bytes 7+16bits(126)2bytes 7+64bits(127)

            if (payloadLen < 126) {
                console.log('<126');
                mask = data.slice(2, 6);
                payLoadData = data.slice(6);
            } else if (payloadLen == 126) {
                console.log('=126')
                //126 的时候 payloadlength 延长至 7+16bits。所以masking
                mask = data.slice(4, 8); //(6= 4+2 )
                payLoadData = data.slice(8);
                payloadLen = data.readUInt16BE(2);
            } else if (payloadLen == 127) {
                console.log('=127');
                mask = data.slice(8, 12);// (10=2+8)
                payLoadData = data.slice(12);
                payloadLen = data.readUinit64BE(2);
            }


            //解除屏蔽
            for (var i = 0; i < payloadLen; i++) {
                payLoadData[i] = payLoadData[i] ^ mask[i % 4];
            }
            console.log(payLoadData.toString());

            var text;
            try {
                text = JSON.parse(payLoadData.toString());
            }
            catch (e) {
                console.log(e.message);
                text = payLoadData.toString();
            }
            var messageType = text.type;
            var sid = text.sid; //client id

            if (messageType == msgType.login) {

                //推送给 login 的 client 所有在线的用户信息
                socket.write(buildSendMsg(JSON.stringify({
                    data: ids,
                    type: msgType.initFriend

                })), function () {
                    ids.push(sid);
                    console.log(ids);
                })


                so.push({
                    _id: sid,
                    socket: socket
                })

                so.forEach(function (item) {
                    //告知所有在线用户之后，内存中保存刚才登录的用户
                    if (item && (item._id != sid)) {
                        item.socket.write(buildSendMsg(JSON.stringify({
                            type: msgType.login,
                            id: sid
                        })));
                    }
                });

            }
            else if (messageType == msgType.msg) {
                var did = text.did;
                var msg = JSON.stringify({
                    type: msgType.msg,
                    text: text.text || '',
                    sid: sid
                });

                so.forEach(function (item) {
//                    console.log(item._id + ":" + did);
                    if (item._id == did) {
                        item.socket.write(buildSendMsg(msg));
                    }
                })
            }
            else if (messageType == msgType.close) {
                //删除 ids保存client id
                ids.forEach(function (item, index) {
                    if (item == sid) {
                        ids.splice(index, 1);
                    }
                });
                //删除 保存的socket
                so.forEach(function (item, index) {
                    console.log(item._id + ':' + sid);
                    if (item._id == sid) {
                        so.splice(index, 1);
                    } else {
                        item.socket.write(buildSendMsg(JSON.stringify({
                            sid: sid,
                            type: msgType.close
                        })))
                    }
                })
                socket.end();
            }
        }
    });

    socket.on('error', function (error) {
        console.log('******* ERROR ' + error + ' *******');

        // close connection
        socket.end();
    });


    // socket.pipe(socket); // echo back

});
websocket.listen(1338, function () {
    console.log('web socket server begin');
})