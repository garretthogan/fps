import copy from 'copy-to-clipboard';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import {
	CLIENT_CREATE_LOBBY,
	CLIENT_JOIN_LOBBY,
	SERVER_LOBBY_CREATED,
	SERVER_PLAYER_JOINED,
} from '../../utils/events.js';

export default class Lobby {
	constructor(socket) {
		this.socket = socket;
		this.lobbyName = null;
		this.creator = null;
		this.joinCode = null;
		this.localClientId = null;
		this.connectedClients = [];

		this.guiData = {
			username: null,
			created: false,
			joinFromLocal: false,
			joinCode: null,
			localClientId: null,
		};

		const gui = new GUI({ width: 200, title: 'Menu' });

		gui.add({ username: 'username' }, 'username').onChange((username) => {
			this.guiData.username = username;
		});

		const folder = gui.addFolder('Create');
		const folderParams = {
			lobbyName: 'lobbyName',
			create: () => {
				this.guiData.created = true;
				socket.emit(CLIENT_CREATE_LOBBY, this.guiData.username, folderParams.lobbyName);
				folder.hide();
				joinFolder.hide();
			},
		};

		folder.add(folderParams, 'lobbyName');
		folder.add(folderParams, 'create');

		const joinFolder = gui.addFolder('Join');
		const joinFolderParams = {
			joinKey: 'joinKey',
			join: () => {
				this.guiData.joinFromLocal = true;
				socket.emit(CLIENT_JOIN_LOBBY, this.guiData.username, joinFolderParams.joinKey);
				folder.hide();
				joinFolder.hide();
			},
		};

		joinFolder.add(joinFolderParams, 'joinKey');
		joinFolder.add(joinFolderParams, 'join');

		socket.on(SERVER_LOBBY_CREATED, (serverLobbyData) => {
			this.lobbyName = serverLobbyData.lobbyName;
			this.creator = serverLobbyData.owner;
			this.connectedClients = serverLobbyData.players;
			this.joinCode = serverLobbyData.joinKey;
			this.localClientId = serverLobbyData.owner;

			copy(this.joinCode);

			console.log('join code copied to clipdboard!', this.joinCode, this.localClientId);
		});
		socket.on(SERVER_PLAYER_JOINED, (pid, serverLobbyData) => {
			this.lobbyName = serverLobbyData.lobbyName;
			this.creator = serverLobbyData.owner;
			this.connectedClients = serverLobbyData.players;
			this.joinCode = serverLobbyData.joinKey;

			if (!this.localClientId) {
				this.localClientId = pid;
			}

			console.log('player joined lobby', pid, this);
		});
	}
}
