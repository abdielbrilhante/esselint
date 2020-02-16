#!/usr/bin/env node

const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const PORT = 8709;

const waitFor = (func, delay) => new Promise((resolve) => setTimeout(resolve(func()), delay));

const createClientSocket = async () => new Promise((resolve, reject) => {
  const client = new net.Socket();
  client.on('error', reject);
  client.on('connect', () => resolve(client));
  client.connect(PORT);
});

const setup = async (retry = true) => {
  try {
    const client = await createClientSocket();
    return client;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      if (retry) {
        const subprocess = spawn('node', [path.resolve(__dirname, './daemon'), ...args], {
          detached: true,
          stdio: 'ignore',
        });

        subprocess.unref();
      }

      return waitFor(() => setup(false));
    }
    console.error(error);
  }
};

const run = async () => {
  const client = await setup();

  client.on('data', (data) => {
    console.log(data.toString());
    client.destroy();
  });

  client.write(JSON.stringify(args));
};

run();
