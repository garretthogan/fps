import * as THREE from 'three';
import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	Mesh,
	DirectionalLight,
	HemisphereLight,
	Fog,
	Color,
	Clock,
	Vector3,
	Sphere,
	MeshLambertMaterial,
	IcosahedronGeometry,
	AnimationMixer,
	Group,
} from 'three';

import Stats from 'three/examples/jsm/libs/stats.module';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { Octree } from 'three/examples/jsm/math/Octree';
import { OctreeHelper } from 'three/examples/jsm/helpers/OctreeHelper';

import { Capsule } from 'three/examples/jsm/math/Capsule';

import { initGUI } from './gui';
import { registerLobbyHandler } from './lobby';

const socket = io();
registerLobbyHandler(socket);
initGUI(socket);

const FLOOR = -1.75;

const scene = new Scene();

const playerGroup = new Group();

function getGamepad(index) {
	return navigator.getGamepads()[index];
}

/**
 * To do:
 * - game pad support (X)
 * - zombie states
 * - combat, loot, prep phases
 * - multiplayer
 */

const loader = new GLTFLoader().setPath('./models/');

const assetMap = {};

const zombies = [];

let mixer = null;

const ZOMBIES = { SUIT: 0, CON: 1, COP: 2, SAMURAI: 3 };
export function spawnZombie(scene, type = ZOMBIES.COP) {
	const capsule = new Capsule(new Vector3(0, FLOOR, -2), new Vector3(0, FLOOR + 0.6, -2), 0.35);
	const gltf = assetMap['zombies'];
	const skin = gltf.scene.children[type];
	const zombie = skin;

	const animations = gltf.animations;

	mixer = new AnimationMixer(gltf.scene);
	mixer.timeScale = 5;

	const idleAction = mixer.clipAction(animations[0]);
	idleAction.play();

	scene.add(zombie);
	zombie.position.set(0, FLOOR, -2);
	zombie.scale.set(0.8, 0.8, 0.8);

	const update = () => {
		capsule.start.set(zombie.position.z, zombie.position.y, zombie.position.z);
		capsule.end.set(capsule.start.x, capsule.start.y + 0.6, capsule.start.z);
	};

	zombies.push({ mesh: zombie, capsule, update });
}

export function init() {
	const container = document.getElementById('game-container');

	const clock = new Clock();
	scene.background = new Color(0x88ccee);
	scene.fog = new Fog(0x88ccee, 0, 50);

	const camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.01, 1000);
	playerGroup.add(camera);

	const fillLight1 = new HemisphereLight(0x4488bb, 0x002244, 0.5);
	fillLight1.position.set(2, 1, 1);
	scene.add(fillLight1);

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

	const renderer = new WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.VSMShadowMap;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;

	container.appendChild(renderer.domElement);

	const stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	const GRAVITY = 30;

	const NUM_SPHERES = 10;
	const SPHERE_RADIUS = 0.2;

	const STEPS_PER_FRAME = 5;

	const sphereGeometry = new IcosahedronGeometry(SPHERE_RADIUS, 5);
	const sphereMaterial = new MeshLambertMaterial({ color: 0xbbbb44 });

	const spheres = [];
	let sphereIdx = 0;

	for (let i = 0; i < NUM_SPHERES; i++) {
		const sphere = new Mesh(sphereGeometry, sphereMaterial);
		sphere.castShadow = true;
		sphere.receiveShadow = true;

		scene.add(sphere);

		spheres.push({
			mesh: sphere,
			collider: new Sphere(new Vector3(0, -100, 0), SPHERE_RADIUS),
			velocity: new Vector3(),
		});
	}

	/**
	 * "Zombies Mixamo" (https://skfb.ly/o9F7W) by ann55010970637 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
	 */

	loader.load('Zombies.glb', (gltf) => {
		assetMap['zombies'] = gltf;
		// spawnZombie(scene);
	});

	const worldOctree = new Octree();

	const playerCollider = new Capsule(new Vector3(0, 0.35, 0), new Vector3(0, 1, 0), 0.35);

	const playerVelocity = new Vector3();
	const playerDirection = new Vector3();

	let playerOnFloor = false;
	let mouseTime = 0;

	const keyStates = {};

	const vector1 = new Vector3();
	const vector2 = new Vector3();
	const vector3 = new Vector3();

	document.addEventListener('keydown', (event) => {
		keyStates[event.code] = true;
	});

	document.addEventListener('keyup', (event) => {
		keyStates[event.code] = false;
	});

	container.addEventListener('mousedown', () => {
		document.body.requestPointerLock();

		mouseTime = performance.now();
	});

	document.addEventListener('mouseup', () => {
		if (document.pointerLockElement !== null) throwBall();
	});

	document.body.addEventListener('mousemove', (event) => {
		if (document.pointerLockElement === document.body) {
			camera.rotation.y -= event.movementX / 500;
		}
	});

	window.addEventListener('resize', onWindowResize);

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function throwBall() {
		const sphere = spheres[sphereIdx];

		camera.getWorldDirection(playerDirection);

		sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);

		// throw the ball with more force if we hold the button longer, and if we move forward

		const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

		sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
		sphere.velocity.addScaledVector(playerVelocity, 2);

		sphereIdx = (sphereIdx + 1) % spheres.length;
	}

	function playerCollisions() {
		const result = worldOctree.capsuleIntersect(playerCollider);

		playerOnFloor = false;

		if (result) {
			playerOnFloor = result.normal.y > 0;

			if (!playerOnFloor) {
				playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
			}

			playerCollider.translate(result.normal.multiplyScalar(result.depth));
		}
	}

	function updatePlayer(deltaTime) {
		let damping = Math.exp(-4 * deltaTime) - 1;

		if (!playerOnFloor) {
			playerVelocity.y -= GRAVITY * deltaTime;

			// small air resistance
			damping *= 0.1;
		}

		playerVelocity.addScaledVector(playerVelocity, damping);

		const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
		playerCollider.translate(deltaPosition);

		playerCollisions();

		playerGroup.position.copy(playerCollider.end);
	}

	function playerSphereCollision(sphere) {
		const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

		const sphere_center = sphere.collider.center;

		const r = playerCollider.radius + sphere.collider.radius;
		const r2 = r * r;

		// approximation: player = 3 spheres

		for (const point of [playerCollider.start, playerCollider.end, center]) {
			const d2 = point.distanceToSquared(sphere_center);

			if (d2 < r2) {
				const normal = vector1.subVectors(point, sphere_center).normalize();
				const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
				const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

				playerVelocity.add(v2).sub(v1);
				sphere.velocity.add(v1).sub(v2);

				const d = (r - Math.sqrt(d2)) / 2;
				sphere_center.addScaledVector(normal, -d);
			}
		}
	}

	function spheresCollisions() {
		for (let i = 0, length = spheres.length; i < length; i++) {
			const s1 = spheres[i];

			for (let j = i + 1; j < length; j++) {
				const s2 = spheres[j];

				const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
				const r = s1.collider.radius + s2.collider.radius;
				const r2 = r * r;

				if (d2 < r2) {
					const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
					const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
					const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

					s1.velocity.add(v2).sub(v1);
					s2.velocity.add(v1).sub(v2);

					const d = (r - Math.sqrt(d2)) / 2;

					s1.collider.center.addScaledVector(normal, d);
					s2.collider.center.addScaledVector(normal, -d);
				}
			}
		}
	}

	function updateSpheres(deltaTime) {
		spheres.forEach((sphere) => {
			sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

			const result = worldOctree.sphereIntersect(sphere.collider);

			if (result) {
				sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
				sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
			} else {
				sphere.velocity.y -= GRAVITY * deltaTime;
			}

			const damping = Math.exp(-1.5 * deltaTime) - 1;
			sphere.velocity.addScaledVector(sphere.velocity, damping);

			playerSphereCollision(sphere);
		});

		spheresCollisions();

		for (const sphere of spheres) {
			sphere.mesh.position.copy(sphere.collider.center);
		}
	}

	function getForwardVector() {
		camera.getWorldDirection(playerDirection);
		playerDirection.y = 0;
		playerDirection.normalize();

		return playerDirection;
	}

	function getSideVector() {
		camera.getWorldDirection(playerDirection);
		playerDirection.y = 0;
		playerDirection.normalize();
		playerDirection.cross(camera.up);

		return playerDirection;
	}

	function controls(deltaTime) {
		// gives a bit of air control
		const speedDelta = deltaTime * (playerOnFloor ? 15 : 8);

		if (keyStates['KeyW']) {
			playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
		}

		if (keyStates['KeyS']) {
			playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
		}

		if (keyStates['KeyA']) {
			playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
		}

		if (keyStates['KeyD']) {
			playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
		}

		if (playerOnFloor) {
			if (keyStates['Space']) {
				// playerVelocity.y = 15;
			}
		}
	}

	loader.load('collision-world.glb', (gltf) => {
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

		animate();
	});

	function teleportPlayerIfOob() {
		if (camera.position.y <= -25) {
			playerCollider.start.set(0, 0.35, 0);
			playerCollider.end.set(0, 1, 0);
			playerCollider.radius = 0.35;
			camera.position.copy(playerCollider.end);
			camera.rotation.set(0, 0, 0);
		}
	}

	let canPlayerThrow = true;

	function onTriggerDown() {
		canPlayerThrow = false;
		throwBall();
	}
	function onTriggerUp() {
		canPlayerThrow = true;
	}

	function processInput(deltaTime, axes, buttons) {
		const faceButtons = buttons.slice(0, 4);

		const triggers = buttons.slice(4, 8);
		const RT = 3;
		if (triggers[RT].pressed && canPlayerThrow) {
			onTriggerDown();
		} else if (!triggers[RT].pressed && !canPlayerThrow) {
			onTriggerUp();
		}

		const speedDelta = deltaTime * (playerOnFloor ? 15 : 8);

		const lStick = [axes[0], axes[1]];
		const rStick = [axes[2], axes[3]];

		const lHorizontal = lStick[0];
		const lVertical = -1 * lStick[1];

		const lVertTrunc = lVertical < -0.2 || lVertical > 0.2 ? lVertical : 0;
		const lHorizontalTrunc = lHorizontal < -0.2 || lHorizontal > 0.2 ? lHorizontal : 0;

		playerVelocity.add(getForwardVector().multiplyScalar(speedDelta * lVertTrunc));
		playerVelocity.add(getSideVector().multiplyScalar(speedDelta * lHorizontalTrunc));

		const rHorizontal = rStick[0];
		const rVertical = rStick[1];

		const rVertTrunc = rVertical < -0.2 || rVertical > 0.2 ? rVertical : 0;
		const rHorizontalTrunc = rHorizontal < -0.2 || rHorizontal > 0.2 ? rHorizontal : 0;

		playerGroup.rotation.y -= rHorizontalTrunc / 100;
		camera.rotation.x -= rVertTrunc / 100;
	}

	function animate() {
		const gamepad = getGamepad(0);

		const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

		// we look for collisions in substeps to mitigate the risk of
		// an object traversing another too quickly for detection.

		for (let i = 0; i < STEPS_PER_FRAME; i++) {
			if (gamepad) {
				processInput(deltaTime, gamepad.axes, gamepad.buttons);
			}

			controls(deltaTime);

			updatePlayer(deltaTime);

			updateSpheres(deltaTime);

			teleportPlayerIfOob();
		}

		if (mixer) mixer.update(deltaTime);

		renderer.render(scene, camera);

		stats.update();

		requestAnimationFrame(animate);
	}
}

init();