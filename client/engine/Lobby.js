import copy from 'copy-to-clipboard';
import { SERVER_LOBBY_CREATED, SERVER_PLAYER_JOINED } from '../../utils/events.js';

export default class LobbyManager {
	constructor() {
		this.lobbyName = null;
		this.creator = null;
		this.username = null;
		this.joinCode = null;
		this.localClientId = null;
		this.connectedClients = [];
		this.joinFromLocal = false;
		this.created = false;

		// socket.on(SERVER_LOBBY_CREATED, (serverLobbyData) => {
		// 	this.lobbyName = serverLobbyData.lobbyName;
		// 	this.creator = serverLobbyData.owner;
		// 	this.connectedClients = serverLobbyData.players;
		// 	this.joinCode = serverLobbyData.joinKey;
		// 	this.localClientId = serverLobbyData.owner;

		// 	copy(this.joinCode);

		// 	console.log('join code copied to clipdboard!', this.joinCode, this.localClientId);
		// });
	}
}
