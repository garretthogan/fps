import copy from 'copy-to-clipboard';
import {
	CLIENT_JOIN_LOBBY,
	CLIENT_START_GAME,
	CLIENT_UPDATE_POSITION,
	CLIENT_UPDATE_ROTATION,
	LOAD_MAP,
	SERVER_CLIENT_JOINED,
	SERVER_LOBBY_CREATED,
	SERVER_UPDATE_POSITION,
	SERVER_UPDATE_ROTATION,
} from '../../utils/events.js';
import { RemotePlayer } from './RemotePlayer.js';

export default class Lobby {
	constructor(joinCode, mapName) {
		this.mapName = mapName || 'collision-world';
		this.joinCode = joinCode;
		this.events = { [`${SERVER_CLIENT_JOINED}`]: [], [`${LOAD_MAP}`]: [] };

		// maybe initialize 4-8 since there will never be more
		// players than that?
		this.remotePlayers = {};

		this.lobbyId = null;
		this.localClientId = null;
		this.connectedClients = null;

		const socketUrl = process.env.NODE_ENV === 'dev' ? 'ws://localhost:3000' : 'wss://multiplayer-fps.herokuapp.com';

		this.socket = new WebSocket(socketUrl);
		this.socket.onopen = this.onOpen.bind(this);
		this.socket.onmessage = this.onMessage.bind(this);
		this.socket.onerror = console.warn;

		this.addEventListener = this.addEventListener.bind(this);
	}

	addEventListener(event, handler) {
		this.events[event].push(handler);
	}

	dispatch(event, args) {
		this.events[event].map((cb) => cb(args));
	}

	removeListener(event, listener) {
		this.events[event] = this.events[event].filter((cb) => cb !== listener);
	}

	registerRemoteClient(clientId) {
		const rp = new RemotePlayer(clientId);
		this.remotePlayers[clientId] = rp;

		return rp;
	}

	remoteClients() {
		return this.connectedClients.filter((clientId) => clientId !== this.localClientId);
	}

	updatePlayerPosition(position) {
		if (this.localClientId) {
			this.socket.send(
				JSON.stringify({
					type: CLIENT_UPDATE_POSITION,
					data: {
						lobbyId: this.lobbyId,
						clientId: this.localClientId,
						x: position.x,
						y: position.y,
						z: position.z,
					},
				})
			);
		}
	}

	updatePlayerRotation(rotation) {
		if (this.localClientId) {
			this.socket.send(
				JSON.stringify({
					type: CLIENT_UPDATE_ROTATION,
					data: {
						lobbyId: this.lobbyId,
						clientId: this.localClientId,
						x: rotation.x,
						y: rotation.y,
						z: rotation.z,
					},
				})
			);
		}
	}

	onLobbyCreated(eventData) {
		this.owner = eventData.owner;
		this.lobbyId = eventData.lobbyId;
		this.localClientId = eventData.owner;
		this.connectedClients = eventData.clients;
		copy(
			process.env.NODE_ENV === 'dev'
				? `http://localhost:3000/join/${this.lobbyId}`
				: `https://multiplayer-fps.herokuapp.com/join/${this.lobbyId}`
		);

		console.log('you created a lobby!', this.lobbyId, this.localClientId);
	}
	onClientJoined(eventData) {
		console.log('client joined', eventData.clientId);
		if (!this.localClientId) {
			this.mapName = eventData.mapName;
			this.connectedClients = eventData.clients;
			this.localClientId = eventData.clientId;
			this.connectedClients.map((clientId) => {
				//console.log('backspawning', clientId);
				this.dispatch(SERVER_CLIENT_JOINED, clientId);
			});
			console.log('load map', this.mapName);
			this.dispatch(LOAD_MAP, this.mapName);
			console.log('your local id is', this.localClientId);
		} else {
			//console.log('spawn player for', eventData.clientId);
			this.dispatch(SERVER_CLIENT_JOINED, eventData.clientId);
		}

		this.connectedClients = eventData.clients;
		this.lobbyId = eventData.lobbyId;
		console.log('from existing lobby', this.connectedClients, this.lobbyId);
	}
	onServerUpdatePosition(eventData) {
		const x = eventData.x;
		const y = eventData.y;
		const z = eventData.z;
		const clientId = eventData.clientId;
		if (clientId !== this.localClientId) {
			this.remotePlayers[clientId].root.position.set(x, y, z);
			// console.log(`${clientId} | x:${x} y:${y} z:${z}`);
		}
	}
	onServerUpdateRotation(eventData) {
		const x = eventData.x;
		const y = eventData.y;
		const z = eventData.z;
		const clientId = eventData.clientId;
		if (clientId !== this.localClientId) {
			this.remotePlayers[clientId].root.rotation.y = y;
			// console.log(`${clientId} | y:${y}`);
		}
	}

	onMessage(message) {
		const event = JSON.parse(message.data);
		switch (event.type) {
			case SERVER_LOBBY_CREATED:
				this.onLobbyCreated(event.data);
				break;

			case SERVER_CLIENT_JOINED:
				this.onClientJoined(event.data);
				break;

			case SERVER_UPDATE_POSITION:
				this.onServerUpdatePosition(event.data);
				break;

			case SERVER_UPDATE_ROTATION:
				this.onServerUpdateRotation(event.data);
				break;
		}
	}

	onOpen() {
		console.log('connected');

		if (this.joinCode) {
			this.socket.send(JSON.stringify({ type: CLIENT_JOIN_LOBBY, data: { lobbyId: this.joinCode } }));
		} else {
			this.dispatch(LOAD_MAP, this.mapName);
			this.socket.send(JSON.stringify({ type: CLIENT_START_GAME, data: { mapName: this.mapName } }));
		}
	}
}
