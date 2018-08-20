// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: generator-loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-test');
var SANDBOX = path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('chai').expect;
var common = require('./common');

describe('loopback:middleware generator', function() {
  beforeEach(common.resetWorkspace);
  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  it('adds a new phase to server/middleware.json', function() {
    var builtinSources = Object.keys(readMiddlewaresJsonSync('server'));
    return helpers.run(path.join(__dirname, '../middleware'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'my-middleware-1',
        phase: 'my-phase',
        paths: ['/x', '/y'],
        params: '{"z": 1}',
      }).then(function() {
        var newSources = Object.keys(readMiddlewaresJsonSync('server'));
        var expectedSources = builtinSources.concat(['my-phase']);
        expect(newSources).to.have.members(expectedSources);
      });
  });

  it('adds a new phase next to a selected one', function() {
    return helpers.run(path.join(__dirname, '../middleware'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'my-middleware-2',
        phase: '(custom phase)',
        customPhase: 'my-phase-2',
        nextPhase: 'routes',
        paths: ['/x', '/y'],
        params: '{"z": 1}',
      }).then(function() {
        var newSources = Object.keys(readMiddlewaresJsonSync('server'));
        var p1 = newSources.indexOf('my-phase-2');
        var p2 = newSources.indexOf('routes');
        expect(p1).to.equal(p2 - 1);
      });
  });

  it('adds a new entry to an existing phase in server/middleware.json',
    function() {
      var builtinSources = Object.keys(
        readMiddlewaresJsonSync('server').routes
      );
      return helpers.run(path.join(__dirname, '../middleware'))
        .cd(SANDBOX)
        .withPrompts({
          name: 'my-middleware-3',
          phase: 'routes',
          paths: ['/x', '/y'],
          params: '{"z": 1}',
        }).then(function() {
          // eslint-disable-next-line max-len
          var newSources = Object.keys(readMiddlewaresJsonSync('server').routes);
          var expectedSources = builtinSources.concat(['my-middleware-3']);
          expect(newSources).to.have.members(expectedSources);
        });
    });

  it('supports sub-phase', function() {
    var builtinSources = Object.keys(
      readMiddlewaresJsonSync('server')['routes:after'] || {}
    );
    return helpers.run(path.join(__dirname, '../middleware'))
      .cd(SANDBOX)
      .withPrompts({
        name: 'my-middleware-4',
        phase: 'routes',
        subPhase: 'after',
        paths: ['/x', '/y'],
        params: '{"z": 1}',
      }).then(function() {
        var newSources = Object.keys(
          readMiddlewaresJsonSync('server')['routes:after']
        );
        var expectedSources = builtinSources.concat(['my-middleware-4']);
        expect(newSources).to.have.members(expectedSources);
      });
  });

  function givenMiddlewareGenerator(dsArgs) {
    var path = '../../middleware';
    var name = 'loopback:middleware';
    var gen = common.createGenerator(name, path, [], dsArgs, {});
    return gen;
  }

  function readMiddlewaresJsonSync(facet) {
    var filepath = path.resolve(SANDBOX, facet || 'server', 'middleware.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
