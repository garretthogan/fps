const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const { Server } = require('socket.io');
const { serverLobbyHandler } = require('./serverLobbyHandler');
const io = new Server(server);

app.use(express.static('public'));
app.get('/:room', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

function onConnection(socket) {
	serverLobbyHandler(io, socket);
}

io.on('connection', onConnection);

const port = process.env.NODE_ENV === 'prod' ? process.env.PORT : 3000;
server.listen(port, () => {
	console.log(`listening on *:${port}`);
});
