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
            es5: {
                options: {
                    wrapper: [
                        '<%= banner %>\n;(function(window, document) {',
                        '})(window, document);'
                    ],
                    indent: '    '
                },
                files: {
                    'dist/stickyfill.js': ['dist/stickyfill.js']
                }
            },
            es6: {
                options: {
                    wrapper: [
                        '<%= banner %>',
                        ''
                    ]
                },
                files: {
                    'dist/stickyfill.es6.js': ['src/stickyfill.js']
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
                files: ['package.json'],
                updateConfigs: ['pkg'],
                commit: true,
                commitMessage: 'v %VERSION%',
                commitFiles: ['.'],
                createTag: true,
                tagName: '%VERSION%',
                tagMessage: 'v %VERSION%',
                push: false
            }
        },

        shell: {
            push: {
                command: 'git push'
            },

            pushTags: {
                command: 'git push --tags'
            },

            publishToNpm: {
                command: 'npm publish'
            }
        },

        watch: {
            files: ['src/**/*.js'],
            tasks: ['build']
        }
    });

    grunt.loadNpmTasks('grunt-wrap');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-shell');
    grunt.registerTask('build', ['babel', 'wrap', 'uglify']);
    grunt.registerTask('release', ['bump-only:patch', 'build', 'bump-commit', 'shell:push', 'shell:pushTags', 'shell:publishToNpm']);
    grunt.registerTask('default', ['build', 'watch']);
};
