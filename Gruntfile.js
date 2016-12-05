module.exports = function(grunt) {
    grunt.initConfig({
		browserify: {
			extension: {
				options: {
					exclude: ['lapack'],
				},
				files: {
					'dist/index.js': ['./src/index.js']
				}
			}
		}
    });

	grunt.loadNpmTasks('grunt-browserify');

	grunt.registerTask('deploy', ['browserify']);
}