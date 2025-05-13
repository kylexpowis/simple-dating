// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  const stub = path.resolve(__dirname, "stubs/empty.js");

  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,

    // Supabase Realtime & ws
    "@supabase/realtime-js": stub,
    ws: stub,

    // ws deep paths
    "ws/lib/stream.js": stub,
    "ws/lib/websocket.js": stub,
    "ws/lib/websocket-server.js": stub,
    "ws/lib/extension.js": stub,
    "ws/lib/receiver.js": stub,
    "ws/lib/sender.js": stub,

    // Node.js core modules that ws pulls in
    stream: stub,
    events: stub,
    http: stub,
    https: stub,
    net: stub,
    crypto: stub,
    tls: stub, // ← add this
    url: stub, // ← and this
    zlib: stub,
  };

  return config;
})();
