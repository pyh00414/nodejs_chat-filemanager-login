const SocketIO = require('socket.io');
const axios = require('axios');
const Chat = require('./models/chat');

module.exports = (server, app) => {
	const io = SocketIO(server, { path: '/socket.io' });

	let userRoom = '코다임인턴채팅방';
	const users = [];
	const idList = [];

	app.set('io', io);

	io.on('connection', socket => {
		// socket이 연결되면, 즉 회원이 아이디를 입력하면 현재 방 목록을 보여준다.
		socket.on('newUser', function(newUser) {
			idList[newUser] = socket.id;
			socket.username = newUser;
			
			socket.join(userRoom);
			socket.room = userRoom;

			socket.broadcast.to(userRoom).emit('updateChat', socket.username, 'has entered room');

			Chat.find((err, chat) => {
				if (err) return console.error(err);

				const message = [];
				const users = [];

				chat.map(value => {
					message.push(value.message);
					users.push(value.userId);
				});
				socket.emit('updateMsgRecord', message, users);
			});
		});

		socket.on('whisper', (message, me, you) => {
			io.to(idList[you]).emit('whisper', message, me);
		});

		socket.on('sendMsg', function(msg) {
			axios
				.get('http://project-wvswe.run.goorm.io/doChat', {
			// .get('/doChat', {
					params: {
						msg: msg,
						room: userRoom,
						user: socket.username
					}
				})
				.then(result => {
				// io.sockets.in(socket.room).emit('updateChat', socket.username, msg);
			})
				.catch(error => {
				alert('서버와의 통신에 문제가 있습니다');
				return;
			});
			
             io.sockets.in(socket.room).emit('updateChat', socket.username, msg);
			
		});

		socket.on('disconnect', function() {
			// socket 연결이 끊어졌을 경우, 현재 방의 사람들에게 방을 떠난다는 메시지를 남긴다.
			socket.broadcast.to(socket.room).emit('updateChat', socket.username, 'has left room');

			// 현재 방에 접속한 모든 사람들에게 'updateUserCount' 액션을 보낸다.
			io
				.of('/')
				.in(socket.room)
				.clients(function(error, clients) {
					io.to(socket.room).emit('updateUserCount', clients.length);
				});
		});
	});
};