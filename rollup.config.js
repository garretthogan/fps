import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

export default {
	input: 'client/index.js',
	output: {
		file: 'public/index.js',
		format: 'esm',
	},
	plugins: [replace({ 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV) }), nodeResolve(), commonjs()],
};
