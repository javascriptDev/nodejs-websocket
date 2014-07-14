var net = require( 'net' );
var crypto = require( 'crypto' ),
	md5 = crypto.createHash( 'md5' );
var so = [];
function build_msg( str_msg, mask ) {
	str_msg = str_msg || "";
	mask = mask || false;

	var msg_len = Buffer.byteLength( str_msg, "utf-8" ), packed_data;

	if(msg_len <= 0) {
		return null;
	}

	if(msg_len < 126) {
		packed_data = new Buffer( 2 + msg_len );
		packed_data[0] = 0x81;
		packed_data[1] = msg_len;
		packed_data.write( str_msg, 2 );
	} else if(msg_len <= 0xFFFF) {//用16位表示数据长度
		packed_data = new Buffer( 4 + msg_len );
		packed_data[0] = 0x81;
		packed_data[1] = 126;
		packed_data.writeUInt16BE( msg_len, 2 );
		packed_data.write( str_msg, 4 );
	} else {//用64位表示数据长度
		/*packed_data = new Buffer(10+msg_len);
		 packed_data[0] = 0x81;
		 packed_data[1] = 127;
		 packed_data.writeUInt32BE(msg_len & 0xFFFF0000 >> 32, 2);
		 packed_data.writeUInt32BE(msg_len & 0xFFFF, 6);
		 packed_data.write( str_msg, 10 );*/
	}

	return packed_data;
}

var server = net.createServer( function( socket ) { //'connection' listener
	// socket.setEncoding('utf8');
	so.push( socket );


	socket.on( 'end', function() {
		console.log( 'disconnect' );
	} );

	console.log( 'connect' );
	//var key= c.headers['sec-websocket-key'];
	// console.dir(c);
	//   console.log(key);


	socket.on( 'data', function( data ) {

		var aa = data.toString();

		var a = aa.split( '\r\n' );
		if(a.length > 1) {
			console.log( 'ack' );
			var key;
			a.forEach( function( item ) {
				if(item.indexOf( 'Sec-WebSocket-Key' ) != -1) {
					key = item.split( ':' )[1].replace( /(^\s+)|(\s+$)/g, '' );
				}
			} )
			console.log(key);
			var shasum = crypto.createHash( 'sha1' );
			shasum.update( key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11" );
			key = shasum.digest( 'base64' );

			var headers = [
				'HTTP/1.1 101 Switching Protocols',
				'Upgrade: WebSocket',
				'Connection: Upgrade',
					'Sec-WebSocket-Accept:' + key
			];
			var s = headers.concat( '', '' ).join( '\r\n' );
			socket.write( s );
		} else {

			var aaa = build_msg( 'asdasd' );

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
			if(opCode == 1) {//文字
				var payloadLen = data[1] & 0x7f; // 0111 1111 取第二个字节的后7位

				var mask;
				var payLoadData;
				if(payloadLen < 126) {
					mask = data.slice( 2, 6 );
					payLoadData = data.slice( 6 );

				} else if(payloadLen == 126) {

					mask = data.slice( 6, 10 );
					payLoadData = data.slice( 10 );
					payloadLen = data.readUInt16BE( 2 );


				} else if(payloadLen == 127) {

					mask = data.slice( 10, 14 );
					payLoadData = data.slice( 14 );

				}


				//解除屏蔽
				for( var i = 0; i < payloadLen; i++ ) {
					payLoadData[i] = payLoadData[i] ^ mask[i % 4];
				}

				console.log( payLoadData.toString() );

				so.forEach( function( item ) {
					if(!item.destroyed) {
						item.write( aaa );
					}
				} )
			}

		}
	} );
	socket.on( 'error', function( error ) {
		console.log( '******* ERROR ' + error + ' *******' );

		// close connection
		socket.end();
	} );

} );
server.listen( 8888, function( a, b ) { //'listening' listener

	console.log( 'server bound' );
} );