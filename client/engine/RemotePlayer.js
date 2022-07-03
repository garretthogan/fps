import { Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { SERVER_PLAYER_JOINED, SERVER_UPDATE_POSITION } from '../../utils/events';

function loadMesh(root, file) {
	const loader = new GLTFLoader().setPath('./models/');
	loader.load(file, (gltf) => {
		root.add(gltf.scene);
		gltf.scene.scale.set(0.005, 0.005, 0.005);

		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;

				if (child.material.map) {
					child.material.map.anisotropy = 4;
				}
			}
		});
	});
}

const FLOOR = -1.75;

export class RemotePlayer {
	constructor(owningClientId) {
		this.owner = owningClientId;

		const height = 1.5;
		this.root = new Object3D();
		this.meshParent = new Object3D();
		this.isOnFloor = true;
		this.collider = new Capsule(new Vector3(0, FLOOR, -2), new Vector3(0, FLOOR + height, -2), 0.35);
		this.velocity = new Vector3();
		this.direction = new Vector3();
		this.root.add(this.meshParent);

		loadMesh(this.meshParent, 'drone.glb');
	}
}

export class RemotePlayerManager {
	constructor(world, lobby, socket) {
		this.remotePlayerTransforms = {};
		socket.on(SERVER_PLAYER_JOINED, (clientId, serverLobbyData) => {
			if (!lobby.localClientId) {
				lobby.lobbyName = serverLobbyData.joinKey;
				lobby.creator = serverLobbyData.owner;
				lobby.connectedClients = serverLobbyData.players;
				lobby.joinCode = serverLobbyData.joinKey;
				lobby.localClientId = clientId;
				const players = serverLobbyData.players;
				console.log({ players });
				players.filter((pid) => pid !== clientId).map((pid) => world.spawnRemotePlayer(pid));
				// spawn players already here
			} else {
				const rp = world.spawnRemotePlayer(clientId);
				this.remotePlayerTransforms[clientId] = rp.root;
			}
		});

		socket.on(SERVER_UPDATE_POSITION, (clientId, position) => {
			if (this.remotePlayerTransforms[clientId]) {
				this.remotePlayerTransforms[clientId].position.copy(position);
			}
		});
	}
}
