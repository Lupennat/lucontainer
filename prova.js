require('reflect-metadata');
const { default: circularAStub } = require('./dist/cjs/__tests__/fixtures/circular-a-stub');
const { default: circularBStub } = require('./dist/cjs/__tests__/fixtures/circular-b-stub');
const { default: CircularCStub } = require("./dist/cjs/__tests__/fixtures/circular-c-stub");


console.log( new CircularCStub(new circularAStub(new circularBStub())));