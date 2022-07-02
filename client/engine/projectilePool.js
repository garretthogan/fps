import { IcosahedronGeometry, Mesh, MeshLambertMaterial, Sphere, Vector3 } from 'three';

const GRAVITY = 30;

let sphereIdx = 0;
const SPHERE_RADIUS = 0.2;
const sphereGeometry = new IcosahedronGeometry(SPHERE_RADIUS, 5);
const sphereMaterial = new MeshLambertMaterial({ color: 0xbbbb44 });
const spheres = [];

const vector1 = new Vector3();
const vector2 = new Vector3();
const vector3 = new Vector3();

export function populateProjectilePool(scene, size) {
	for (let i = 0; i < size; i++) {
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
}

export function fireProjectile(position, velocity, direction, offset) {
	const sphere = spheres[sphereIdx];

	sphere.collider.center.copy(position).addScaledVector(direction, offset);

	const impulse = 15 + 30 * (1 * 0.75);

	sphere.velocity.copy(direction).multiplyScalar(impulse);
	sphere.velocity.addScaledVector(velocity, 2);

	sphereIdx = (sphereIdx + 1) % spheres.length;
}

export function updateProjectilePool(dt, worldOctree) {
	spheres.forEach((sphere) => {
		sphere.collider.center.addScaledVector(sphere.velocity, dt);

		const result = worldOctree.sphereIntersect(sphere.collider);

		if (result) {
			sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
			sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
		} else {
			sphere.velocity.y -= GRAVITY * dt;
		}

		const damping = Math.exp(-1.5 * dt) - 1;
		sphere.velocity.addScaledVector(sphere.velocity, damping);
	});

	// sphere collisions
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

	for (const sphere of spheres) {
		sphere.mesh.position.copy(sphere.collider.center);
	}
}
