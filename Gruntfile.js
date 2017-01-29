module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner:
`/*!
  * Stickyfill – \`position: sticky\` polyfill
  * v. <%= pkg.version %> | <%= pkg.homepage %>
  * MIT License
  */
`,

        babel: {
            options: {
                presets: ['es2015']
            },
            dist: {
                files: {
                    'dist/stickyfill.js': 'src/stickyfill.js'
                }
            }
        },

        wrap: {
            options: {
                wrapper: [
                    '<%= banner %>\n;(function(window, document) {',
                    '})(this, document);'
                ],
                indent: '    '
            },
            dist: {
                files: {
                    'dist/stickyfill.js': ['dist/stickyfill.js'],
                    'dist/stickyfill.es6.js': ['src/stickyfill.js'],
                }
            }
        },

        uglify: {
            options: {
                banner: '<%= banner %>',
                mangle: true
            },
            dist: {
                files: {
                    'dist/stickyfill.min.js': ['dist/stickyfill.js']
                }
            }
        },

        bump: {
            options: {
                files: ['package.json', 'bower.json'],
                updateConfigs: ['pkg'],
                commit: true,
                commitMessage: 'tagging v. %VERSION%',
                commitFiles: ['.'],
                createTag: true,
                tagName: '%VERSION%',
                tagMessage: 'tagging v. %VERSION%',
                push: false
            }
        },

        shell: {
            push: {
                command: 'git push'
            },

            pushTags: {
                command: 'git push --tags'
            }
        },

        watch: {
            files: ['src/**/*.js'],
            tasks: ['build']
        },

        connect: {
            server: {
                options: {
                    port: 8001,
                    hostname: '*'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-wrap');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('build', ['babel', 'wrap', 'uglify']);
    grunt.registerTask('release', ['bump-only:patch', 'build', 'bump-commit', 'shell:push', 'shell:pushTags']);
    grunt.registerTask('default', ['connect', 'build', 'watch']);
};
