import {
	ACESFilmicToneMapping,
	Clock,
	Color,
	DirectionalLight,
	Fog,
	HemisphereLight,
	Scene,
	sRGBEncoding,
	VSMShadowMap,
	WebGLRenderer,
} from 'three';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Octree } from 'three/examples/jsm/math/Octree';
import { SERVER_CLIENT_JOINED } from '../../utils/events';
import Player from './Player';
import { populateProjectilePool, updateProjectilePool } from './projectilePool';

function spawnLights(scene) {
	const fillLight = new HemisphereLight(0x4488bb, 0x002244, 0.5);
	fillLight.position.set(2, 1, 1);

	scene.add(fillLight);

	const directionalLight = new DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(-5, 25, -1);
	directionalLight.castShadow = true;
	directionalLight.shadow.camera.near = 0.01;
	directionalLight.shadow.camera.far = 500;
	directionalLight.shadow.camera.right = 30;
	directionalLight.shadow.camera.left = -30;
	directionalLight.shadow.camera.top = 30;
	directionalLight.shadow.camera.bottom = -30;
	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;
	directionalLight.shadow.radius = 4;
	directionalLight.shadow.bias = -0.00006;
	scene.add(directionalLight);
}

function loadLevel(scene, worldOctree, file = 'collision-world.glb') {
	const loader = new GLTFLoader().setPath('./models/');
	loader.load(file, (gltf) => {
		scene.add(gltf.scene);

		worldOctree.fromGraphNode(gltf.scene);

		gltf.scene.traverse((child) => {
			if (child.isMesh) {
				child.castShadow = true;
				child.receiveShadow = true;

				if (child.material.map) {
					child.material.map.anisotropy = 4;
				}
			}
		});

		const helper = new OctreeHelper(worldOctree);
		helper.visible = false;
		scene.add(helper);
	});
}

export default class World {
	constructor(lobby) {
		this.lobby = lobby;
		this.lobby.addEventListener(SERVER_CLIENT_JOINED, this.spawnRemotePlayer.bind(this));

		this.tickRateMs = 100;
		window.addEventListener('resize', this.onWindowResize.bind(this));

		this.clock = new Clock();
		this.worldOctree = new Octree();

		this.scene = new Scene();
		this.scene.background = new Color(0x88ccee);
		this.scene.fog = new Fog(0x88ccee, 0, 50);

		this.player = new Player(this.scene, this);

		this.renderer = new WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = VSMShadowMap;
		this.renderer.outputEncoding = sRGBEncoding;
		this.renderer.toneMapping = ACESFilmicToneMapping;

		spawnLights(this.scene);
		populateProjectilePool(this.scene, 10);
		loadLevel(this.scene, this.worldOctree, 'collision-world.glb');

		const container = document.getElementById('game-container');
		container.appendChild(this.renderer.domElement);

		this.update = this.update.bind(this);
	}

	spawnRemotePlayer(clientId) {
		const rp = this.lobby.registerRemoteClient(clientId);
		this.scene.add(rp.root);
	}

	update() {
		const STEPS_PER_FRAME = 3;
		const dt = Math.min(0.05, this.clock.getDelta()) / STEPS_PER_FRAME;

		for (let step = 0; step < STEPS_PER_FRAME; step++) {
			this.player.update(dt);

			updateProjectilePool(dt, this.worldOctree);
		}

		//replicate local player position
		const position = this.player.root.position;
		const rotation = this.player.root.rotation;
		this.lobby.updatePlayerPosition(position);
		this.lobby.updatePlayerRotation(rotation);

		this.renderer.render(this.scene, this.player.camera);
		requestAnimationFrame(this.update);
	}

	onWindowResize() {
		this.player.camera.aspect = window.innerWidth / window.innerHeight;
		this.player.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
}
