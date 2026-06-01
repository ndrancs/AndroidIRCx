#!/usr/bin/env node

const fs = require('fs');
const net = require('net');
const path = require('path');
const tls = require('tls');

const DEFAULT_CONFIG = path.join(__dirname, 'live-interop.fixtures.json');
const CAP_SUBCOMMANDS = new Set([
  'LS',
  'LIST',
  'REQ',
  'ACK',
  'NAK',
  'NEW',
  'DEL',
]);
const DEFAULT_REQUEST_CAPS = [
  'server-time',
  'message-tags',
  'batch',
  'labeled-response',
  'cap-notify',
  'multi-prefix',
  'userhost-in-names',
  'away-notify',
  'account-notify',
  'extended-join',
  'chghost',
  'standard-replies',
  'message-ids',
  'monitor',
  'draft/extended-isupport',
  'draft/chathistory',
  'chathistory',
  'draft/read-marker',
  'draft/metadata-2',
  'metadata-2',
  'no-implicit-names',
];

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG,
    fixtures: [],
    includeDisabled: false,
    json: false,
    list: false,
    timeoutMs: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--config') {
      args.config = argv[++index];
    } else if (arg === '--fixture') {
      args.fixtures.push(argv[++index]);
    } else if (arg === '--include-disabled') {
      args.includeDisabled = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--list') {
      args.list = true;
    } else if (arg === '--timeout-ms') {
      args.timeoutMs = Number(argv[++index]);
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/ircv3/live-interop.js [options]

Options:
  --config <path>       Fixture JSON file. Defaults to scripts/ircv3/live-interop.fixtures.json.
  --fixture <id>        Run only a fixture id. Can be repeated.
  --include-disabled    Include disabled fixtures when listing or running.
  --list                List fixtures without connecting.
  --timeout-ms <n>      Per-fixture timeout override.
  --json                Print machine-readable JSON summary.
  -h, --help            Show this help.
`);
}

function expandEnvValue(value, env = process.env) {
  if (typeof value === 'string') {
    return value.replace(
      /\$\{([A-Z0-9_]+)(:-([^}]*))?\}/gi,
      (_, name, _fallbackPart, fallback) => {
        const envValue = env[name];
        if (envValue !== undefined && envValue !== '') {
          return envValue;
        }
        return fallback !== undefined ? fallback : '';
      },
    );
  }

  if (Array.isArray(value)) {
    return value.map(entry => expandEnvValue(entry, env));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        expandEnvValue(entry, env),
      ]),
    );
  }

  return value;
}

function loadFixtureConfig(configPath, env = process.env) {
  const resolved = path.resolve(configPath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const parsed = JSON.parse(raw);
  const fixtures = Array.isArray(parsed) ? parsed : parsed.fixtures;

  if (!Array.isArray(fixtures)) {
    throw new Error(
      `Fixture config must be an array or an object with a fixtures array: ${resolved}`,
    );
  }

  return fixtures.map(fixture =>
    normalizeFixture(expandEnvValue(fixture, env), resolved),
  );
}

function normalizeFixture(fixture, configPath) {
  if (!fixture.id) {
    throw new Error(`Fixture in ${configPath} is missing id`);
  }

  const transport =
    fixture.transport ||
    (fixture.url ? 'websocket' : fixture.tls === false ? 'tcp' : 'tls');

  return {
    ...fixture,
    enabled: fixture.enabled !== false,
    host: fixture.host || '',
    port: Number(fixture.port || (fixture.tls === false ? 6667 : 6697)),
    transport,
    tls: fixture.tls !== false,
    webSocketSubprotocol:
      fixture.webSocketSubprotocol || fixture.subprotocol || 'binary.ircv3.net',
    nickPrefix: fixture.nickPrefix || 'AIXv3',
    requestCaps: fixture.requestCaps || DEFAULT_REQUEST_CAPS,
    requireRegistration: fixture.requireRegistration !== false,
    timeoutMs: Number(fixture.timeoutMs || 15000),
    settleAfterRegistrationMs: Number(
      fixture.settleAfterRegistrationMs || 1200,
    ),
    probes: fixture.probes || {},
  };
}

function parseIrcLine(line) {
  let rest = line;
  let tags = {};
  let prefix;
  const params = [];

  if (rest.startsWith('@')) {
    const spaceIndex = rest.indexOf(' ');
    if (spaceIndex === -1) {
      return { tags: parseIrcTags(rest.slice(1)), prefix, command: '', params };
    }

    tags = parseIrcTags(rest.slice(1, spaceIndex));
    rest = rest.slice(spaceIndex + 1);
  }

  if (rest.startsWith(':')) {
    const spaceIndex = rest.indexOf(' ');
    if (spaceIndex === -1) {
      return { tags, prefix: rest.slice(1), command: '', params };
    }
    prefix = rest.slice(1, spaceIndex);
    rest = rest.slice(spaceIndex + 1);
  }

  const firstSpaceIndex = rest.indexOf(' ');
  const command = (
    firstSpaceIndex === -1 ? rest : rest.slice(0, firstSpaceIndex)
  ).toUpperCase();
  rest = firstSpaceIndex === -1 ? '' : rest.slice(firstSpaceIndex + 1);

  while (rest.length > 0) {
    if (rest.startsWith(':')) {
      params.push(rest.slice(1));
      break;
    }

    const spaceIndex = rest.indexOf(' ');
    if (spaceIndex === -1) {
      params.push(rest);
      break;
    }

    params.push(rest.slice(0, spaceIndex));
    rest = rest.slice(spaceIndex + 1).replace(/^ +/, '');
  }

  return { tags, prefix, command, params };
}

function parseIrcTags(rawTags) {
  if (!rawTags) {
    return {};
  }

  return Object.fromEntries(
    rawTags
      .split(';')
      .filter(Boolean)
      .map(entry => {
        const [key, ...valueParts] = entry.split('=');
        return [
          key,
          unescapeIrcTagValue(
            valueParts.length > 0 ? valueParts.join('=') : true,
          ),
        ];
      }),
  );
}

function unescapeIrcTagValue(value) {
  if (value === true) {
    return value;
  }

  return value
    .replace(/\\:/g, ';')
    .replace(/\\s/g, ' ')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\');
}

function parseCapTokens(payload) {
  if (!payload) {
    return [];
  }

  return payload
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => {
      const [name, ...valueParts] = token.split('=');
      return {
        name: name.toLowerCase(),
        value: valueParts.length > 0 ? valueParts.join('=') : undefined,
      };
    });
}

function getCapMessage(params) {
  const subcommandIndex = params.findIndex(param =>
    CAP_SUBCOMMANDS.has(String(param).toUpperCase()),
  );
  if (subcommandIndex === -1) {
    return undefined;
  }

  const subcommand = String(params[subcommandIndex]).toUpperCase();
  const afterSubcommand = params.slice(subcommandIndex + 1);
  const continuation = afterSubcommand.includes('*');
  const payload = afterSubcommand.filter(param => param !== '*').join(' ');

  return { subcommand, payload, continuation };
}

function parseISupportTokens(params) {
  const tokens = {};

  for (const param of params.slice(1)) {
    if (!param || param.includes(' ')) {
      continue;
    }

    if (param.includes('=')) {
      const [key, ...valueParts] = param.split('=');
      tokens[key.toUpperCase()] = valueParts.join('=');
    } else if (/^[A-Z0-9-]+$/i.test(param)) {
      tokens[param.toUpperCase()] = true;
    }
  }

  return tokens;
}

function createSocket(fixture) {
  if (fixture.tls) {
    return tls.connect({
      host: fixture.host,
      port: fixture.port,
      servername: fixture.servername || fixture.host,
      rejectUnauthorized: fixture.rejectUnauthorized !== false,
    });
  }

  return net.connect({
    host: fixture.host,
    port: fixture.port,
  });
}

function isWebSocketFixture(fixture) {
  return (
    fixture.transport === 'websocket' ||
    fixture.websocket === true ||
    /^wss?:\/\//i.test(fixture.url || '')
  );
}

function createConnection(fixture) {
  if (!isWebSocketFixture(fixture)) {
    const socket = createSocket(fixture);
    return {
      on: (event, handler) => socket.on(event, handler),
      setEncoding: encoding => socket.setEncoding(encoding),
      writeLine: line => socket.write(`${line}\r\n`),
      end: () => socket.end(),
      destroy: () => socket.destroy(),
      get destroyed() {
        return socket.destroyed;
      },
    };
  }

  if (typeof WebSocket !== 'function') {
    throw new Error(
      'This Node.js runtime does not provide a global WebSocket implementation.',
    );
  }

  if (!fixture.url) {
    throw new Error('WebSocket fixture is missing url.');
  }

  const subprotocols = Array.isArray(fixture.webSocketSubprotocol)
    ? fixture.webSocketSubprotocol
    : [fixture.webSocketSubprotocol];
  const socket = new WebSocket(fixture.url, subprotocols.filter(Boolean));

  const readMessage = (data, handler) => {
    if (typeof data === 'string') {
      handler(data.endsWith('\n') ? data : `${data}\n`);
    } else if (Buffer.isBuffer(data)) {
      const text = data.toString('utf8');
      handler(text.endsWith('\n') ? text : `${text}\n`);
    } else if (data instanceof ArrayBuffer) {
      const text = Buffer.from(data).toString('utf8');
      handler(text.endsWith('\n') ? text : `${text}\n`);
    } else if (data && typeof data.text === 'function') {
      data
        .text()
        .then(text => handler(text.endsWith('\n') ? text : `${text}\n`));
    }
  };

  return {
    on: (event, handler) => {
      if (event === 'connect') {
        socket.addEventListener('open', handler);
      } else if (event === 'data') {
        socket.addEventListener('message', message =>
          readMessage(message.data, handler),
        );
      } else if (event === 'error') {
        socket.addEventListener('error', error =>
          handler(error.error || error),
        );
      } else if (event === 'close') {
        socket.addEventListener('close', handler);
      }
    },
    setEncoding: () => {},
    writeLine: line => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(line);
      }
    },
    end: () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, 'AndroidIRCX IRCv3 interop probe complete');
      }
    },
    destroy: () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    },
    get destroyed() {
      return (
        socket.readyState === WebSocket.CLOSING ||
        socket.readyState === WebSocket.CLOSED
      );
    },
  };
}

function buildNick(prefix) {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}${suffix}`.slice(0, 18);
}

function runFixture(fixture, options = {}) {
  const timeoutMs = Number(options.timeoutMs || fixture.timeoutMs || 15000);
  const nick = fixture.nick || buildNick(fixture.nickPrefix);
  const user = fixture.user || 'androidircx';
  const result = {
    id: fixture.id,
    family: fixture.family || fixture.id,
    transport: isWebSocketFixture(fixture) ? 'websocket' : fixture.transport,
    host: fixture.host || fixture.url,
    port: fixture.port,
    tls: fixture.tls,
    webSocketSubprotocol: isWebSocketFixture(fixture)
      ? fixture.webSocketSubprotocol
      : undefined,
    connected: false,
    registered: false,
    capLsReceived: false,
    availableCaps: [],
    requestedCaps: [],
    acknowledgedCaps: [],
    rejectedCaps: [],
    capList: [],
    isupport: {},
    warnings: [],
    errors: [],
    passed: false,
  };

  if (isWebSocketFixture(fixture) && !fixture.url) {
    result.errors.push(
      'WebSocket fixture url is empty after environment expansion.',
    );
    return Promise.resolve(result);
  }

  if (!isWebSocketFixture(fixture) && (!fixture.host || !fixture.port)) {
    result.errors.push(
      'Fixture host or port is empty after environment expansion.',
    );
    return Promise.resolve(result);
  }

  return new Promise(resolve => {
    const availableCaps = new Map();
    const acknowledgedCaps = new Set();
    const rejectedCaps = new Set();
    const pendingCaps = new Set();
    const capList = new Set();
    let socket;
    let buffer = '';
    let capLsDone = false;
    let capEndSent = false;
    let finished = false;
    let finishTimer;

    const timeout = setTimeout(() => {
      result.errors.push(`Timed out after ${timeoutMs}ms.`);
      finish();
    }, timeoutMs);

    const send = line => {
      if (socket && !socket.destroyed) {
        socket.writeLine(line);
      }
    };

    const finish = () => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeout);
      clearTimeout(finishTimer);
      result.availableCaps = Array.from(availableCaps.keys()).sort();
      result.acknowledgedCaps = Array.from(acknowledgedCaps).sort();
      result.rejectedCaps = Array.from(rejectedCaps).sort();
      result.capList = Array.from(capList).sort();

      const hasRequiredCaps = (fixture.requiredCaps || []).every(cap =>
        availableCaps.has(cap.toLowerCase()),
      );
      const hasAnyExpectedCap =
        !fixture.expectedAnyCaps ||
        fixture.expectedAnyCaps.length === 0 ||
        fixture.expectedAnyCaps.some(cap =>
          availableCaps.has(cap.toLowerCase()),
        );

      if (!hasRequiredCaps) {
        result.errors.push(
          `Missing required caps: ${fixture.requiredCaps.join(', ')}`,
        );
      }

      if (!hasAnyExpectedCap) {
        result.errors.push(
          `None of expected caps were advertised: ${fixture.expectedAnyCaps.join(', ')}`,
        );
      }

      result.passed =
        result.connected &&
        result.capLsReceived &&
        hasRequiredCaps &&
        hasAnyExpectedCap &&
        (!fixture.requireRegistration || result.registered) &&
        result.errors.length === 0;

      if (socket && !socket.destroyed) {
        try {
          send('QUIT :AndroidIRCX IRCv3 interop probe complete');
        } catch (_error) {
          // Ignore shutdown write failures.
        }
        socket.end();
        socket.destroy();
      }

      resolve(result);
    };

    const maybeEndCapNegotiation = () => {
      if (!capLsDone || capEndSent || pendingCaps.size > 0) {
        return;
      }

      capEndSent = true;
      send('CAP END');
    };

    const requestAdvertisedCaps = () => {
      const requested = fixture.requestCaps
        .map(cap => cap.toLowerCase())
        .filter(cap => availableCaps.has(cap));

      for (const cap of requested) {
        pendingCaps.add(cap);
      }

      result.requestedCaps = requested.sort();

      if (requested.length > 0) {
        send(`CAP REQ :${requested.join(' ')}`);
      } else {
        maybeEndCapNegotiation();
      }
    };

    const handleCap = message => {
      if (!message) {
        return;
      }

      if (message.subcommand === 'LS' || message.subcommand === 'NEW') {
        result.capLsReceived =
          result.capLsReceived || message.subcommand === 'LS';
        for (const token of parseCapTokens(message.payload)) {
          availableCaps.set(token.name, token.value);
        }

        if (message.subcommand === 'LS' && !message.continuation) {
          capLsDone = true;
          requestAdvertisedCaps();
        }
      } else if (message.subcommand === 'ACK') {
        for (const token of parseCapTokens(message.payload)) {
          acknowledgedCaps.add(token.name);
          pendingCaps.delete(token.name);
        }
        maybeEndCapNegotiation();
      } else if (message.subcommand === 'NAK') {
        for (const token of parseCapTokens(message.payload)) {
          rejectedCaps.add(token.name);
          pendingCaps.delete(token.name);
        }
        maybeEndCapNegotiation();
      } else if (message.subcommand === 'LIST') {
        for (const token of parseCapTokens(message.payload)) {
          capList.add(token.name);
        }
      } else if (message.subcommand === 'DEL') {
        for (const token of parseCapTokens(message.payload)) {
          availableCaps.delete(token.name);
        }
      }
    };

    const handleLine = line => {
      if (!line) {
        return;
      }

      const message = parseIrcLine(line);

      if (message.command === 'PING') {
        send(`PONG :${message.params[0] || ''}`);
        return;
      }

      if (message.command === 'CAP') {
        handleCap(getCapMessage(message.params));
        return;
      }

      if (message.command === '001') {
        result.registered = true;
        if (fixture.probes.capListAfterRegistration !== false) {
          send('CAP LIST');
        }

        if (fixture.probes.monitorList && acknowledgedCaps.has('monitor')) {
          send('MONITOR L');
        }

        finishTimer = setTimeout(finish, fixture.settleAfterRegistrationMs);
        return;
      }

      if (message.command === '005') {
        Object.assign(result.isupport, parseISupportTokens(message.params));
      } else if (message.command === 'ERROR') {
        result.errors.push(
          message.params.join(' ') ||
            'Server closed the connection with ERROR.',
        );
      } else if (message.command === '433') {
        result.warnings.push('Generated nick was already in use.');
      }
    };

    try {
      socket = createConnection(fixture);
    } catch (error) {
      result.errors.push(error.message);
      finish();
      return;
    }

    socket.setEncoding('utf8');

    socket.on('connect', () => {
      result.connected = true;

      if (
        fixture.webirc &&
        fixture.webirc.password &&
        fixture.webirc.gateway &&
        fixture.webirc.clientAddress
      ) {
        const clientAddress = fixture.webirc.clientAddress;
        const clientHostname = fixture.webirc.clientHostname || clientAddress;
        send(
          `WEBIRC ${fixture.webirc.password} ${fixture.webirc.gateway} ${clientHostname} ${clientAddress}`,
        );
      }

      send('CAP LS 302');

      if (fixture.pass) {
        send(`PASS ${fixture.pass}`);
      }

      send(`NICK ${nick}`);
      send(`USER ${user} 0 * :AndroidIRCX IRCv3 interop probe`);
    });

    socket.on('data', chunk => {
      buffer += chunk;
      const lines = buffer.split(/\r\n|\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        handleLine(line.replace(/\r$/, ''));
      }
    });

    socket.on('error', error => {
      result.errors.push(error.message);
      finish();
    });

    socket.on('close', () => {
      if (!finished) {
        finish();
      }
    });
  });
}

function selectFixtures(fixtures, args) {
  let selected = fixtures;

  if (!args.includeDisabled) {
    selected = selected.filter(fixture => fixture.enabled);
  }

  if (args.fixtures.length > 0) {
    const wanted = new Set(args.fixtures);
    selected = selected.filter(fixture => wanted.has(fixture.id));
  }

  return selected;
}

function printFixtureList(fixtures) {
  for (const fixture of fixtures) {
    const state = fixture.enabled ? 'enabled' : 'disabled';
    const transport = isWebSocketFixture(fixture)
      ? 'websocket'
      : fixture.tls
        ? 'tls'
        : 'tcp';
    const target = isWebSocketFixture(fixture)
      ? fixture.url
      : `${fixture.host}:${fixture.port}`;
    console.log(
      `${fixture.id}\t${state}\t${fixture.family || fixture.id}\t${transport}\t${target}`,
    );
  }
}

function printSummary(results) {
  for (const result of results) {
    const state = result.passed ? 'PASS' : 'FAIL';
    const caps =
      result.availableCaps.length > 0
        ? result.availableCaps.join(', ')
        : 'none';
    const target =
      result.transport === 'websocket'
        ? result.host
        : `${result.host}:${result.port}`;
    console.log(`${state} ${result.id} (${result.family}) ${target}`);
    console.log(
      `  connected=${result.connected} registered=${result.registered} capLs=${result.capLsReceived}`,
    );
    console.log(`  advertisedCaps=${caps}`);

    if (result.acknowledgedCaps.length > 0) {
      console.log(`  acknowledgedCaps=${result.acknowledgedCaps.join(', ')}`);
    }

    for (const warning of result.warnings) {
      console.log(`  warning: ${warning}`);
    }

    for (const error of result.errors) {
      console.log(`  error: ${error}`);
    }
  }
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return 0;
  }

  const fixtures = loadFixtureConfig(args.config);
  const selected = selectFixtures(fixtures, args);

  if (args.list) {
    printFixtureList(selected);
    return 0;
  }

  if (selected.length === 0) {
    throw new Error('No fixtures selected.');
  }

  const results = [];
  for (const fixture of selected) {
    results.push(await runFixture(fixture, { timeoutMs: args.timeoutMs }));
  }

  if (args.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printSummary(results);
  }

  return results.every(result => result.passed) ? 0 : 1;
}

if (require.main === module) {
  main()
    .then(exitCode => {
      process.exitCode = exitCode;
    })
    .catch(error => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  DEFAULT_REQUEST_CAPS,
  expandEnvValue,
  getCapMessage,
  loadFixtureConfig,
  normalizeFixture,
  parseArgs,
  parseCapTokens,
  parseIrcTags,
  parseIrcLine,
  parseISupportTokens,
  runFixture,
  selectFixtures,
};
