import nodeResolve from '@rollup/plugin-node-resolve';

export default {
	input: 'src/game.js',
	output: {
		file: 'public/index.js',
		format: 'esm',
	},
	plugins: [nodeResolve()],
};
