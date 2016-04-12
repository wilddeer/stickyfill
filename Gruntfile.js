/*global module */
module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n * Stickyfill -- `position: sticky` polyfill\n * v. <%= pkg.version %> | <%= pkg.homepage %>\n * Copyright <%= pkg.author.name %> | <%= pkg.author.url %>\n *\n * MIT License\n */\n',

        umd: {
            options: {
                globalAlias: '<%= pkg.name %>'
            },
            'default': {
                src: 'src/stickyfill.js',
                dest: '<%= pkg.main %>'
            }
        },

        uglify: {
            options: {
                banner: '<%= banner %>',
                mangle: {
                    except: ['Stickyfill', '$', 'jQuery']
                }
            },
            dist: {
                files: {
                    'dist/stickyfill.min.js': ['<%= pkg.main %>']
                }
            }
        },

        concat: {
            options: {
                banner: '<%= banner %>',
                separator: '\n'
            },
            dist: {
                src: ['<%= pkg.main %>'],
                dest: '<%= pkg.main %>'
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

    // build
    grunt.loadNpmTasks('grunt-umd');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('build', ['umd', 'concat', 'uglify']);
    grunt.registerTask('release', ['bump-only:patch', 'uglify', 'umd', 'concat', 'bump-commit', 'shell:push', 'shell:pushTags']);
    grunt.registerTask('w', ['connect', 'build', 'watch']);
    grunt.registerTask('default', 'build');
};
