module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  grunt.initConfig({
    less: {
      development: {
        options: {
          compress: false,
          yuicompress: false,
          optimization: 0
        },
        files: {
          "public/css/bootstrap.css": "bower_components/bootstrap/less/bootstrap.less", // destination file and source file
          "public/css/index.css": "less/views/index.less" // destination file and source file
        }
      }
    },
    watch: {
      styles: {
        files: ['bower_components/bootstrap/less/**/*.less', 'less/**/*.less'], // which files to watch
        tasks: ['less'],
        options: {
          nospawn: true
        }
      }
    }
  });

  grunt.registerTask('default', ['less', 'watch']);
};