const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const {
	CLIENT_CREATE_LOBBY,
	SERVER_LOBBY_CREATED,
	CLIENT_UPDATE_POSITION,
	SERVER_UPDATE_POSITION,
	CLIENT_JOIN_LOBBY,
	SERVER_CLIENT_JOINED,
} = require('../utils/events');

const shortid = require('shortid');

const createKey = (key) => `${key}_${shortid.generate().replace('_', ':')}`;

const lobbies = {};

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3535 });

wss.on('connection', (connectedClient) => {
	connectedClient.on('message', (data) => {
		const event = JSON.parse(data);

		switch (event.type) {
			case CLIENT_CREATE_LOBBY:
				const owner = createKey('gret');
				const lobbyId = `lobby_${shortid.generate()}`;
				lobbies[lobbyId] = { owner, id: lobbyId, clients: [{ clientId: owner, socket: connectedClient }] };

				connectedClient.send(
					JSON.stringify({
						type: SERVER_LOBBY_CREATED,
						data: { clientId: owner, lobbyId },
					})
				);
				break;

			case CLIENT_JOIN_LOBBY:
				const clientId = `gret_${shortid.generate()}`;
				lobbies[event.data.lobbyId].clients.push({ clientId, socket: connectedClient });
				const connectedClientIds = lobbies[event.data.lobbyId].clients.map((c) => c.clientId);
				lobbies[event.data.lobbyId].clients.map((c) =>
					c.socket.send(
						JSON.stringify({
							type: SERVER_CLIENT_JOINED,
							data: { clientId, connectedClientIds, lobbyId: event.data.lobbyId },
						})
					)
				);
				break;

			case CLIENT_UPDATE_POSITION:
				lobbies[event.data.lobbyId].clients.map((c) =>
					c.socket.send(
						JSON.stringify({
							type: SERVER_UPDATE_POSITION,
							data: { position: event.data.position, clientId: event.data.clientId },
						})
					)
				);
				break;
		}
	});
});

app.use(express.static('public'));
app.get('/:room', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

const port = process.env.NODE_ENV === 'prod' ? process.env.PORT : 3000;
server.listen(port, () => {
	console.log(`listening on *:${port}`);
});
