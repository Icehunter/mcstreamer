const OPTS = {};

process.argv.slice(2).forEach((arg) => {
  if (arg.includes('--')) {
    OPTS[arg.replace('--', '')] = true;
  }
});

const {
  Transform
} = require('stream');
const fs = require('fs');

const byteSize = (str) => {
  return Buffer.byteLength(str, 'utf8');
};

const _writer = fs.createWriteStream('./report.log', {
  flags: 'w'
});

const _duplex = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
});

const _summary = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
});

const _report = new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
});

const start = process.hrtime();

let _firstRun = true;
let _initialSize = 0;
let _currentSize = 0;
let _lineCount = 0;

_duplex.setEncoding('utf8');
_duplex.on('data', (chunk) => {
  const lines = chunk.split('\n').filter((line) => line.trim());

  if (_firstRun) {
    _firstRun = false;
    _initialSize = byteSize(chunk);
    _currentSize += _initialSize;
    _lineCount = lines.length;
    if (OPTS.verbose) {
      console.log('Initial Chunk Summary:', JSON.stringify({
        size: _initialSize,
        lineCount: _lineCount
      }, null, 2));
    }
    return;
  }

  const elapsed = process.hrtime(start);

  const newLines = lines.splice(_lineCount);
  const newSize = byteSize(newLines.join('\n'));
  const newLineCount = newLines.length;

  _currentSize += newSize;
  _lineCount += newLineCount;

  _summary.write(JSON.stringify({
    elapsed,
    newSize,
    newLineCount
  }));
});

_summary.setEncoding('utf8');
_summary.on('data', (chunk) => {
  const data = JSON.parse(chunk);

  const timeSpan = (data.elapsed[0] + ((data.elapsed[1] / 100000) / 1000));
  const growthRate = data.newSize / timeSpan;
  if (OPTS.verbose) {
    console.log('Chunk Summary:', JSON.stringify(data, null, 2));
  }
  _report.write(JSON.stringify({
    growthRate,
    size: _currentSize,
    lineCount: _lineCount
  }));
});

_report.setEncoding('utf8');
_report.on('data', (chunk) => {
  const data = JSON.parse(chunk);
  _writer.write(`Timestamp: ${Date.now()}, LineCount: ${data.lineCount}, GrowthRate: ${data.growthRate} bytes/second, FileSize: ${data.size} bytes\n`);
});

if (module.parent) {
  module.exports = {
    _duplex
  };
} else {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => _duplex.write(chunk));
}
