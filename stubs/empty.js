module.exports = {
  RealtimeClient: class {
    channel() {
      return this;
    }
    on() {
      return this;
    }
    subscribe() {
      return this;
    }
    removeChannel() {}
    removeAllListeners() {}
  },
  WebSocket: () => {}, // in case something does `new WebSocket()`
};
