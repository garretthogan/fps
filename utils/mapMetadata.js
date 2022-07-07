const mapFloorHeights = {
	'collision-world': 2,
	'art-gallery': 1,
	'low-poly-playland': 30,
	'scifi-repair-dock': 30,
	'squid-game-map': 30,
};

const mapScales = {
	'collision-world': { x: 1, y: 1, Z: 1 },
	'art-gallery': { x: 0.01, y: 0.01, z: 0.01 },
	'low-poly-playland': { x: 0.45, y: 0.45, z: 0.45 },
	'scifi-repair-dock': { x: 0.2, y: 0.2, z: 0.2 },
	'squid-game-map': { x: 0.45, y: 0.45, z: 0.45 },
};

module.exports = { mapFloorHeights, mapScales };
