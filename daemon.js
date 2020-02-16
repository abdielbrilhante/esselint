#!/usr/bin/env node

// steps:
// load eslint module (recursive search, fallback to global)
// watch for config file changes
// remove when closed?
// keep path as key
// reload on project load?

const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 8709;
const config = {
  allowHalfOpen: true,
};

const UPPER_LEVEL = /(.*)+(\/(.*))$/gu;

const server = new net.Server(config);
const cache = [];

const matchCachedInstance = (filename) => {
  for (const instance of cache) {
    const relative = path.relative(instance.path, filename);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
      return instance.cli;
    }
  }

  return null;
};

const findESLintInstance = (filename) => {
  let dir = filename.replace(UPPER_LEVEL, '$1');
  while (dir) {
    const modulePath = `${dir}/node_modules/eslint/package.json`;
    try {
      fs.accessSync(modulePath);
      return `${dir}/node_modules/eslint`;
    } catch (error) {
      dir = dir.replace(UPPER_LEVEL, '$1');
    }
  }

  return null;
};

const createInstance = (filename) => {
  const eslintPath = findESLintInstance(filename);

  if (eslintPath) {
    const { CLIEngine } = require(eslintPath);
    cache[eslintPath] = {
      path: eslintPath,
      engine: CLIEngine,
      cli: new CLIEngine({ fix: true }),
    };

    return cache[eslintPath];
  }
};

server.on('connection', (conn) => {
  conn.on('data', (data) => {
    const [filename, ...args] = JSON.parse(data.toString());

    const eslint = matchCachedInstance(filename) || createInstance(filename);
    if (eslint) {
      const report = eslint.cli.executeOnFiles([filename]);
      if (args.includes('--fix')) {
        eslint.engine.outputFixes(report);
      }

      conn.write(JSON.stringify(report.results.map((result) => result.messages)[0]));
    }

    conn.end();
  });
});

server.listen(PORT);
