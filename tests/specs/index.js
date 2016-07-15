const fs = require('fs');
const path = require('path');
const Chance = require('chance');
const chance = new Chance();
const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const source = require('../../src/');

const byteSize = (str) => {
  return Buffer.byteLength(str, 'utf8');
};

const initialLineLimit = chance.integer({
  min: 10,
  max: 200
});
const generateSourceLog = () => {
  const results = [];
  for (let i = 0; i < initialLineLimit; i++) {
    results.push(chance.sentence({
      words: chance.integer({
        min: 1,
        max: 20
      })
    }));
  }
  return results;
};

const primer = ['INITALIZE'];
const sourceLines = generateSourceLog();
const sourceSize = byteSize(sourceLines.join('\n'));

const LineCount = sourceLines.length + primer.length;
const FileSize = sourceSize + byteSize(primer[0]);

source._duplex.write(primer[0]);
source._duplex.write([].concat(primer).concat(sourceLines).join('\n'));

lab.experiment('mcstreamer', () => {
  lab.test('generate a non-empty report.log file', (done) => {
    fs.readFile(path.resolve(__dirname, '../../report.log'), 'utf8', (err, data) => {
      Code.expect(err).to.not.exist();
      Code.expect(data).to.not.equal('');
      done();
    });
  });
  lab.test(`should report a LineCount of ${LineCount}`, (done) => {
    fs.readFile(path.resolve(__dirname, '../../report.log'), 'utf8', (err, data) => {
      Code.expect(err).to.not.exist();
      Code.expect(data).to.not.equal('');
      Code.expect(data.includes(`LineCount: ${LineCount}`)).to.be.equal(true);
      done();
    });
  });
  lab.test(`should report a FileSize of ${FileSize}`, (done) => {
    fs.readFile(path.resolve(__dirname, '../../report.log'), 'utf8', (err, data) => {
      Code.expect(err).to.not.exist();
      Code.expect(data).to.not.equal('');
      Code.expect(data.includes(`FileSize: ${FileSize}`)).to.be.equal(true);
      done();
    });
  });
});
