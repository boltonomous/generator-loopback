// Copyright IBM Corp. 2014,2016. All Rights Reserved.
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

describe('loopback:soap tests', function() {
  describe('stock quote wsdl', function() {
    beforeEach(common.resetWorkspace);
    beforeEach(function createSandbox(done) {
      helpers.testDirectory(SANDBOX, done);
    });
    beforeEach(function createProject(done) {
      common.createDummyProject(SANDBOX, 'test-soapapp', done);
    });
    beforeEach(function createDataSource(done) {
      var modelGen = givenDataSourceGenerator();
      helpers.mockPrompt(modelGen, {
        name: 'soapds',
        connector: 'soap',
        url: 'http://www.webservicex.net/stockquote.asmx',
        wsdl: path.join(__dirname, 'soap/stockquote.wsdl'),
        remotingEnabled: true,
        installConnector: false,
      });
      modelGen.run(function() {
        done();
      });
    });

    it('stock quote wsdl',
      function(done) {
        var modelGen = givenModelGenerator();
        helpers.mockPrompt(modelGen, {
          dataSource: 'soapds',
          service: 'StockQuote',
          binding: 'StockQuoteSoap',
          operations: ['GetQuote'],
        });

        // this runs command  loopback:soap command with mock up /test/soap/stockquote.wsdl as input from command prompt
        modelGen.run(function() {
          var content = readModelJsonSync('get-quote');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.symbol.type).to.eql('string');
          expect(content.properties.globals.type).to.eql('Globals');

          content = readModelJsonSync('globals');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.Promise.type).to.eql('boolean');
          expect(content.properties.Promise.type).to.eql('boolean');

          content = readModelJsonSync('get-quote-response');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.GetQuoteResult.type).to.eql('string');

          var modelConfig = readModelConfigSync('server');
          expect(modelConfig).to.have.property('GetQuote');
          expect(modelConfig.GetQuote).to.have.property('public', true);
          done();
        });
      });
  });

  describe('calculator wsdl', function() {
    beforeEach(common.resetWorkspace);

    beforeEach(function createSandbox(done) {
      helpers.testDirectory(SANDBOX, done);
    });

    beforeEach(function createProject(done) {
      common.createDummyProject(SANDBOX, 'test-soapapp', done);
    });

    beforeEach(function createDataSource(done) {
      var modelGen = givenDataSourceGenerator();
      helpers.mockPrompt(modelGen, {
        name: 'soapds',
        connector: 'soap',
        url: 'http://www.dneonline.com/calculator.asmx',
        wsdl: 'http://www.dneonline.com/calculator.asmx?WSDL',
        remotingEnabled: true,
        installConnector: false,
      });
      modelGen.run(function() {
        done();
      });
    });

    it('calculator wsdl',
      function(done) {
        var modelGen = givenModelGenerator();
        helpers.mockPrompt(modelGen, {
          dataSource: 'soapds',
          url: 'http://www.dneonline.com/calculator.asmx?WSDL',
          service: 'Calculator',
          binding: 'CalculatorSoap',
          operations: ['Add', 'Divide', 'Multiply', 'Subtract'],
        });

        modelGen.run(function() {
          var content = readModelJsonSync('add');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.intA.type).to.eql('number');
          expect(content.properties.intB.type).to.eql('number');
          expect(content).to.have.property('excludeBaseProperties');
          var expectedExcludeProps = ['id'];
          expect(content.excludeBaseProperties).
            to.deep.equal(expectedExcludeProps);

          content = readModelJsonSync('add-response');
          expect(content.properties.AddResult.type).to.eql('number');

          content = readModelJsonSync('divide');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.intA.type).to.eql('number');
          expect(content.properties.intB.type).to.eql('number');

          content = readModelJsonSync('divide-response');
          expect(content.properties.DivideResult.type).to.eql('number');

          content = readModelJsonSync('multiply');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.intA.type).to.eql('number');
          expect(content.properties.intB.type).to.eql('number');

          content = readModelJsonSync('multiply-response');
          expect(content.properties.MultiplyResult.type).to.eql('number');

          content = readModelJsonSync('subtract');
          expect(content).to.not.have.property('public');
          expect(content).to.have.property('properties');
          expect(content.properties.intA.type).to.eql('number');
          expect(content.properties.intB.type).to.eql('number');

          content = readModelJsonSync('subtract-response');
          expect(content.properties.SubtractResult.type).to.eql('number');

          var modelConfig = readModelConfigSync('server');
          expect(modelConfig).to.have.property('Add');
          expect(modelConfig.Add).to.have.property('public', true);

          expect(modelConfig).to.have.property('Divide');
          expect(modelConfig.Divide).to.have.property('public', true);

          expect(modelConfig).to.have.property('Multiply');
          expect(modelConfig.Multiply).to.have.property('public', true);

          expect(modelConfig).to.have.property('Subtract');
          expect(modelConfig.Subtract).to.have.property('public', true);

          done();
        });
      });
  });

  describe('binding with special character', function() {
    beforeEach(common.resetWorkspace);
    beforeEach(function createSandbox(done) {
      helpers.testDirectory(SANDBOX, done);
    });
    beforeEach(function createProject(done) {
      common.createDummyProject(SANDBOX, 'test-soapapp', done);
    });
    beforeEach(function createDataSource(done) {
      var modelGen = givenDataSourceGenerator();
      helpers.mockPrompt(modelGen, {
        name: 'soapds',
        connector: 'soap',
        url: 'http://localhost:15099/rpc_Literal_testing',
        wsdl: path.join(__dirname, 'soap/special_char_test.wsdl'),
        remotingEnabled: true,
        installConnector: false,
      });
      modelGen.run(function() {
        done();
      });
    });

    it('API file name test',
      function(done) {
        var modelGen = givenModelGenerator();
        helpers.mockPrompt(modelGen, {
          dataSource: 'soapds',
          service: 'RPCLiteralService',
          binding: 'RPCLiteralTest2.0Binding',
          operations: ['myMethod'],
        });

        // this runs command  loopback:soap command with mock up /test/soap/special_char_test.wsdl as input from command prompt
        modelGen.run(function() {
          var content = readAPIFileSync('soap-rpc-literal-test-2-0-binding');
          done();
        });
      });
  });

  function readAPIFileSync(name) {
    var soapAPIJson = path.resolve(SANDBOX, 'server/models/' + name + '.json');
    expect(fs.existsSync(soapAPIJson)).to.equal(true);
    var soapAPIModel = path.resolve(SANDBOX, 'server/models/' + name + '.js');
    expect(fs.existsSync(soapAPIModel)).to.equal(true);
  }

  function givenModelGenerator(modelArgs) {
    var path = '../../soap';
    var name = 'loopback:soap';
    var deps = [];
    var gen = common.createGenerator(name, path, deps, modelArgs, {});
    return gen;
  }

  function readModelJsonSync(name) {
    var soapJson = path.resolve(SANDBOX, 'common/models/' + name + '.json');
    expect(fs.existsSync(soapJson)).to.equal(true);
    return JSON.parse(fs.readFileSync(soapJson));
  }

  function givenDataSourceGenerator(dsArgs) {
    var path = '../../datasource';
    var name = 'loopback:datasource';
    var gen = common.createGenerator(name, path, [], dsArgs, {});
    return gen;
  }

  function readModelConfigSync(facet) {
    facet = facet || 'server';
    var filepath = path.resolve(SANDBOX, facet, 'model-config.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }

  function readDataSourcesJsonSync(facet) {
    var filepath = path.resolve(SANDBOX, facet || 'server', 'datasources.json'); // eslint-disable-line max-len
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});
