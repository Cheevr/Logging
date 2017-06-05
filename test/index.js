/* globals describe, it, after, afterEach, before, beforeEach */
const fs = require('fs');
const expect = require('chai').expect;
const Logger = require('..');
const path = require('path');


function cleanUp(dir) {
    dir = path.join(__dirname, '..', dir);
    if (fs.existsSync(dir)) {
        let files = fs.readdirSync(dir);
        for (let file of files) {
            fs.unlinkSync(path.join(dir, file));
        }
    }
}

describe('Logger', () => {
    afterEach(() => cleanUp('logs'));

    it('should load with the request log loaded by default', () => {
        expect(Logger.requests).to.be.an('object');
        expect(Logger.requests.info).to.be.a('function');
        expect(Logger.requests.warn).to.be.a('function');
        expect(Logger.requests.err).to.be.a('function');
        expect(Logger.requests.error).to.be.a('function');
    });

    it('should not log anything if the Logger is disabled', done => {
        Logger.enabled(false);
        Logger.requests.info('test');
        let date = new Date().toISOString().substr(0, 10);
        setTimeout(() => {
            expect(fs.existsSync(path.join(__dirname, '../logs/requests.log'))).to.be.not.ok;
            Logger.enabled(true);
            Logger.requests.info('test');
            setTimeout(() => {
                expect(fs.existsSync(path.join(__dirname, '../logs/requests.log'))).to.be.ok;
                expect(fs.existsSync(path.join(__dirname, '../logs/requests.' + date + '.log'))).to.be.ok;
                expect(Logger._backup).to.be.not.ok;
                done();
            });
        }, 100);
    });
});


