const shortid = require('shortid');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server);

const JOIN_ROOM = 'join room';
const CREATE_ROOM = 'create room';

app.use(express.static('public'));
app.get('/:room', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connected');

	socket.on(JOIN_ROOM, (room, player) => {
		console.log('join room ', room, player);
		const playerKey = `${player}_${shortid.generate()}`;
		socket.join(room);
		io.to(room).emit('new player', playerKey);
	});

	socket.on(CREATE_ROOM, (room, player) => {
		console.log('room created ', room, player);
		const roomKey = `${room}_${shortid.generate()}`;
		const playerKey = `${player}_${shortid.generate()}`;
		socket.join(roomKey);
		io.to(roomKey).emit('new player', playerKey, roomKey);
	});
});

const port = process.env.NODE_ENV === 'prod' ? process.env.PORT : 3000;
server.listen(port, () => {
	console.log(`listening on *:${port}`);
});
