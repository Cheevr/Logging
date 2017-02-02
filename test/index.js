/* globals describe, it, after, afterEach, before, beforeEach */
const fs = require('fs');
const expect = require('chai').expect;
const Logger = require('..');

const cwd = process.cwd();

function cleanUp(dir) {
    dir = path.join(cwd, dir);
    if (fs.existsSync(cwd)) {
        fs.unlinkSync(dir);
    }
}

describe('Logger', () => {
    it('should load with the request log loaded by default', () => {
        expect(Logger.requests).to.be.an('object');
        expect(Logger.requests.info).to.be.a('function');
        expect(Logger.requests.warn).to.be.a('function');
        expect(Logger.requests.err).to.be.a('function');
        expect(Logger.requests.error).to.be.a('function');
    });
});


