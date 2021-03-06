// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var semver = require('semver');
var ygAssert = require('yeoman-assert');
var helpers = require('yeoman-test');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var common = require('./common');
var assert = require('assert');
var expect = require('chai').expect;
var fs = require('fs');

describe('loopback:app generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  // This is a simple smoke test to execute all generator steps
  // Since most of the heavy lifting is done by loopback-workspace,
  // we don't have to test it again.

  var EXPECTED_PROJECT_FILES = [
    '.gitignore',
    'package.json',

    'server/config.json',
    'server/datasources.json',
    'server/model-config.json',
    'server/server.js',

    'client/README.md',
  ];

  var EXPECTED_BLUEMIX_FILES = [
    '.bluemix/datasources-config.json',
    '.bluemix/deploy.json',
    '.bluemix/pipeline.yml',
    '.bluemix/toolchain.yml',

    'server/datasources.bluemix.js',

    '.cfignore',
    '.dockerignore',
    'Dockerfile',
    'manifest.yml',
  ];

  var DOCKER_FILES = [
    '.dockerignore',
    'Dockerfile',
  ];

  var TOOLCHAIN_FILES = [
    '.bluemix/deploy.json',
    '.bluemix/pipeline.yml',
    '.bluemix/toolchain.yml',
  ];

  it('creates expected files', function(done) {
    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      name: 'test-app',
      template: 'api-server',
    });

    gen.options['skip-install'] = true;
    gen.run(function() {
      ygAssert.file(EXPECTED_PROJECT_FILES);
      done();
    });
  });

  it('creates the project in a subdirectory if asked to', function(done) {
    var gen = givenAppGenerator();

    helpers.mockPrompt(gen, {
      appname: 'test-app',
      template: 'api-server',
      dir: 'test-dir',
    });

    gen.run(function() {
      // generator calls `chdir` on change of the destination root
      process.chdir(SANDBOX);

      var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
        return 'test-dir/' + f;
      });
      ygAssert.file(expectedFiles);
      assert.equal(gen.dir, 'test-dir');
      done();
    });
  });

  it('normalizes the appname with .', function(done) {
    var cwdName = 'x.y';
    var expectedAppName = 'x-y';
    testAppNameNormalization(cwdName, expectedAppName, done);
  });

  it('normalizes the appname with space', function(done) {
    var cwdName = 'x y';
    var expectedAppName = 'x-y';
    testAppNameNormalization(cwdName, expectedAppName, done);
  });

  it('normalizes the appname with @', function(done) {
    var cwdName = 'x@y';
    var expectedAppName = 'x-y';
    testAppNameNormalization(cwdName, expectedAppName, done);
  });

  it('should create .yo-rc.json', function(done) {
    var gen = givenAppGenerator();
    helpers.mockPrompt(gen, {dir: '.'});
    gen.run(function() {
      var yoRcPath = path.resolve(SANDBOX, '.yo-rc.json');
      assert(fs.existsSync(yoRcPath), 'file exists');
      done();
    });
  });

  it('includes explorer by default', function(done) {
    var gen = givenAppGenerator();
    helpers.mockPrompt(gen, {dir: '.'});
    gen.run(function() {
      var compConfig = common.readJsonSync('server/component-config.json', {});
      expect(Object.keys(compConfig))
        .to.contain('loopback-component-explorer');
      done();
    });
  });

  it('excludes explorer with --no-explorer', function(done) {
    var gen = givenAppGenerator();
    gen.options.explorer = false;
    helpers.mockPrompt(gen, {dir: '.'});
    gen.run(function() {
      var compConfig = common.readJsonSync('server/component-config.json', {});
      expect(Object.keys(compConfig))
        .to.not.contain('loopback-component-explorer');
      done();
    });
  });

  it('scaffolds 3.x app when loopbackVersion is 3.x',
    function(done) {
      var gen = givenAppGenerator();

      helpers.mockPrompt(gen, {
        name: 'test-app',
        template: 'api-server',
        loopbackVersion: '3.x',
      });
      gen.run(function() {
        var pkg = common.readJsonSync('package.json', {});
        expect(semver.gtr('3.0.0', pkg.dependencies.loopback)).to.equal(false);
        done();
      });
    });

  it('scaffolds 3.x app when options.loopbackVersion is 3.x',
    function(done) {
      var gen = givenAppGenerator();

      gen.options.loopbackVersion = '3.x';
      helpers.mockPrompt(gen, {
        name: 'test-app',
        template: 'api-server',
      });
      gen.run(function() {
        var pkg = common.readJsonSync('package.json', {});
        expect(semver.gtr('3.0.0', pkg.dependencies.loopback)).to.equal(false);
        done();
      });
    });

  it('scaffolds 3.x app with loopbackVersion "3.x" and template "notes"',
    function(done) {
      var gen = givenAppGenerator();

      gen.options.loopbackVersion = '3.x';
      gen.options.template = 'notes';
      helpers.mockPrompt(gen, {
        name: 'test-app',
      });
      gen.run(function() {
        var notes = common.readJsonSync('common/models/note.json', {});
        expect(notes).to.have.property('name', 'Note');
        done();
      });
    });

  it('reports error if options.loopbackVersion is invalid',
    function(done) {
      var gen = givenAppGenerator();

      gen.options.loopbackVersion = 'invalid-version';
      helpers.mockPrompt(gen, {
        name: 'test-app',
        template: 'api-server',
      });
      gen.on('error', function(err) {
        // Set a no-op error handler and deal with it in the
        // callback function below
      });
      gen.run(function(err) {
        expect(err.message).to.eql(
          'Invalid LoopBack version: invalid-version. ' +
          'Available versions are 2.x, 3.x.'
        );

        // a way to get around Workspace.copyRecursive not being properly
        // restored to its original method
        gen.emit('end');
        done();
      });
    });

  it('reports error if options.template is invalid',
    function(done) {
      var gen = givenAppGenerator();

      gen.options.loopbackVersion = '3.x';
      gen.options.template = 'invalid-template';
      helpers.mockPrompt(gen, {
        name: 'test-app',
      });
      gen.on('error', function(err) {
        // Set a no-op error handler and deal with it in the
        // callback function below
      });
      gen.run(function(err) {
        expect(err.message).to.eql(
          'Invalid template: invalid-template. Available templates for 3.x ' +
          'are api-server, empty-server, hello-world, notes'
        );

        // a way to get around Workspace.copyRecursive not being properly
        // restored to its original method
        gen.emit('end');
        done();
      });
    });

  it('scaffolds 2.x app when option.loopbackVersion is 2.x',
    function(done) {
      var gen = givenAppGenerator();

      helpers.mockPrompt(gen, {
        name: 'test-app',
        template: 'api-server',
        loopbackVersion: '2.x',
      });
      gen.run(function() {
        var pkg = common.readJsonSync('package.json', {});
        expect(semver.gtr('3.0.0', pkg.dependencies.loopback)).to.equal(true);
        done();
      });
    });

  it('exports workspace version', () => {
    const mainProps = Object.assign({}, require('../'));
    expect(mainProps).to.have.property('workspaceVersion',
      require('loopback-workspace/package.json').version);
  });

  describe('Bluemix integration', function() {
    it('should create all Bluemix files', function(done) {
      var gen = givenAppGenerator();

      helpers.mockPrompt(gen, {
        appname: 'cool-app',
        template: 'api-server',
        appMemory: '1024M',
        appInstances: 5,
        appDomain: 'my.bluemix.net',
        appHost: 'cool-app',
        appDiskQuota: '1280M',
        enableDocker: true,
        enableToolchain: true,
        enableAutoScaling: true,
        enableAppMetrics: true,
      });

      gen.options['skip-install'] = true;
      gen.options['bluemix'] = true;
      gen.options['login'] = false;

      gen.run(function() {
        ygAssert.file(EXPECTED_PROJECT_FILES.concat(EXPECTED_BLUEMIX_FILES));
        ygAssert.fileContent('./manifest.yml', fs.readFileSync(path.join(__dirname, 'fixtures', 'manifest.yml'), 'utf8'));
        done();
      });
    });

    it('should omit Docker files', function(done) {
      var gen = givenAppGenerator();

      helpers.mockPrompt(gen, {
        appname: 'test-app',
        template: 'api-server',
        appMemory: '512M',
        appInstances: 1,
        appDomain: 'mybluemix.net',
        appHost: 'test-app',
        appDiskQuota: '1024M',
        enableDocker: false,
        enableToolchain: true,
        enableAutoScaling: true,
        enableAppMetrics: true,
      });

      gen.options['skip-install'] = true;
      gen.options['bluemix'] = true;
      gen.options['login'] = false;

      gen.run(function() {
        ygAssert.noFile(DOCKER_FILES);
        done();
      });
    });

    it('should ommit Toolchain files', function(done) {
      var gen = givenAppGenerator();

      helpers.mockPrompt(gen, {
        appname: 'test-app',
        template: 'api-server',
        appMemory: '512M',
        appInstances: 1,
        appDomain: 'mybluemix.net',
        appHost: 'test-app',
        appDiskQuota: '1024M',
        enableDocker: false,
        enableToolchain: false,
        enableAutoScaling: true,
        enableAppMetrics: true,
      });

      gen.options['skip-install'] = true;
      gen.options['bluemix'] = true;
      gen.options['login'] = false;

      gen.run(function() {
        ygAssert.file('.bluemix/datasources-config.json');
        ygAssert.noFile(TOOLCHAIN_FILES);
        done();
      });
    });
  });

  function givenAppGenerator(modelArgs) {
    var name = 'loopback:app';
    var path = '../../app';
    var gen = common.createGenerator(name, path, [], modelArgs, {});
    gen.options['skip-install'] = true;
    return gen;
  }

  function testAppNameNormalization(cwdName, expectedAppName, done) {
    var gen = givenAppGenerator();
    var dir = path.join(SANDBOX, cwdName);
    helpers.testDirectory(dir, function() {
      helpers.mockPrompt(gen, {
        wsTemplate: 'api-server',
        dir: cwdName,
      });

      gen.run(function() {
        // generator calls `chdir` on change of the destination root
        process.chdir(SANDBOX);

        var expectedFiles = EXPECTED_PROJECT_FILES.map(function(f) {
          return cwdName + '/' + f;
        });
        ygAssert.file(expectedFiles);
        var pkg = require(path.join(dir, 'package.json'));
        assert.equal(pkg.name, expectedAppName);
        done();
      });
    });
  }
});
