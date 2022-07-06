const shortid = require('shortid');
const {
	CLIENT_START_GAME,
	SERVER_LOBBY_CREATED,
	CLIENT_JOIN_LOBBY,
	SERVER_CLIENT_JOINED,
	CLIENT_UPDATE_POSITION,
	SERVER_UPDATE_POSITION,
} = require('../utils/events');

const lobbies = {};

// maybe stringify lobby data to give each one a smaller footprint

const createKey = () => shortid.generate().replace('_', ':');

module.exports = {
	start(client) {
		console.log('client connected');
		client.on('message', (data) => {
			const key = createKey();
			const event = JSON.parse(data);
			const lobbyId = event.data.lobbyId;

			const connectedClients = lobbies[lobbyId] ? Object.keys(lobbies[lobbyId].clients) : [];

			switch (event.type) {
				// user just naviagted to the website
				case CLIENT_START_GAME:
					console.log('reserve a lobby and replicate movement');
					const newClientId = `client_${key}`;
					const newLobbyId = `lobby_${key}`;

					lobbies[newLobbyId] = {
						owner: newClientId,
						lobbyId: newLobbyId,
						clients: { [newClientId]: client },
						maxConnectedClients: 12,
					};
					client.send(
						JSON.stringify({
							type: SERVER_LOBBY_CREATED,
							data: { ...lobbies[newLobbyId], clients: connectedClients },
						})
					);
					break;

				case CLIENT_JOIN_LOBBY:
					console.log(lobbyId);
					const lobbyToJoin = lobbies[lobbyId];
					if (lobbyToJoin) {
						client.send(
							JSON.stringify({
								type: SERVER_CLIENT_JOINED,
								data: {
									...lobbies[lobbyId],
									clientId: `client_${key}`,
									clients: connectedClients,
								},
							})
						);

						lobbies[lobbyId].clients[`client_${key}`] = client;
						connectedClients.forEach((clientKey) => {
							lobbies[lobbyId].clients[clientKey].send(
								JSON.stringify({
									type: SERVER_CLIENT_JOINED,
									data: {
										...lobbies[lobbyId],
										clientId: `client_${key}`,
										clients: connectedClients,
									},
								})
							);
						});
					}
					break;
				case CLIENT_UPDATE_POSITION:
					const clientId = event.data.clientId;
					const x = event.data.x;
					const y = event.data.y;
					const z = event.data.z;
					connectedClients.forEach((clientKey) => {
						lobbies[lobbyId].clients[clientKey].send(
							JSON.stringify({ type: SERVER_UPDATE_POSITION, data: { clientId, x, y, z } })
						);
					});
					break;
			}
		});
	},
};
