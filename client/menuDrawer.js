import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import { CLIENT_CREATE_LOBBY, CLIENT_JOIN_LOBBY, CLIENT_START_GAME } from '../utils/events';

export default function showMainMenu(socket, lobby) {
	const gui = new GUI({ width: 200, title: 'Menu' });
	gui.add(
		{
			fullscreen: () => {
				document.body.requestFullscreen();
				document.body.addEventListener('mousedown', () => {
					document.body.requestPointerLock();
				});
			},
		},
		'fullscreen'
	);

	let actualUsername;
	gui.add({ username: 'username' }, 'username').onChange((username) => {
		actualUsername = username;
	});

	const folder = gui.addFolder('Create');
	const folderParams = {
		lobbyName: 'lobbyName',
		create: () => {
			gui.add(folderParams, 'start');
			socket.send(
				JSON.stringify({
					type: CLIENT_CREATE_LOBBY,
					data: { creator: actualUsername, lobbyName: folderParams.lobbyName },
				})
			);
			folder.hide();
			joinFolder.hide();
		},
		start: () => {
			if (!lobby.lobbyId) return;

			socket.send(JSON.stringify({ type: CLIENT_START_GAME, data: { lobbyId: lobby.lobbyId } }));
		},
	};

	// folder.add(folderParams, 'lobbyName');
	// folder.add(folderParams, 'create');

	const joinFolder = gui.addFolder('Join');
	const joinFolderParams = {
		joinKey: 'joinKey',
		join: () => {
			socket.send(
				JSON.stringify({
					type: CLIENT_JOIN_LOBBY,
					data: { lobbyId: joinFolderParams.joinKey, username: actualUsername },
				})
			);
			folder.hide();
			joinFolder.hide();
		},
	};

	joinFolder.add(joinFolderParams, 'joinKey');
	joinFolder.add(joinFolderParams, 'join');
}
