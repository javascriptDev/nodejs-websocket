/**
 * Created by a2014 on 14-7-14.
 */
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

//http://tools.ietf.org/html/rfc6455#section-6
/*
在 web socket中，数据 是已 一系列的帧 来传输的。
一个基础的 消息 是由以下部分组成:
1. epcode (标示 消息类型)
2.payload length (假如数据帧到达目的地时正确无误，网络访问层便从数据帧的其余部分中提取数据有效负载（Payload），然后将它一直传送到帧层次类型字段指定的协议。)
3.Payload data ("Extension data" and "Application data")

报文详细解释:
1. FIN  :1bit
标示 这是消息的最后一帧，

2.RSV1, RSV2, RSV3:  1 bit each
没有exttensissons 的话 都是 0;

3. epcode : 4bit
    定义了消息的类型

*  %x0 denotes a continuation frame

*  %x1 denotes a text frame

*  %x2 denotes a binary frame

*  %x3-7 are reserved for further non-control frames

*  %x8 denotes a connection close

*  %x9 denotes a ping

*  %xA denotes a pong

*  %xB-F are reserved for further control frames

4.Mask:  1 bit

识别 payload data 是否 masked。
如果设置成1，那么 masking key 存在 masking-key中。用于unmask
 payload data form client

5.Payload length:  7 bits, 7+16 bits, or 7+64 bits

 in bytes: 如果是 0-125, 这就是 payload 的长度。
 如果是126  接下来的2个 bytes 释为  16 bit 无符号整数 就是 payload 长度
 如果是127  接下来的8个 bytes 释为   64bit 无符号整数 就是 payload 长度


 Masking-key:  0 or 4 bytes
 所有的帧 从客户端发到服务端的 的都 被 用 32bit 值 mask。

 Payload Data :(x+y) bytes
 payload data = extension data+ application data

 Extension Data: x bytes
 如果没有 拓展协商那么 此值 为0；
 所有的拓展 都要指定 拓展的长度，或者提供方法怎么计算他的长度并且


 */