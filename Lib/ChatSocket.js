import { CHAT_SERVER_URL } from "@env";

/**
 * Creates a WebSocket that buffers outgoing messages until the connection
 * is open, and logs all lifecycle events.
 *
 * @param {Object}   params
 * @param {string}   params.token        – Auth token to send as a query param
 * @param {string}   params.userId       – Your user ID
 * @param {string}   params.otherUserId  – The chat partner’s ID
 * @param {Function} params.onMessage    – Called with parsed JSON for each incoming message
 * @param {Function} [params.onOpen]     – Optional callback when socket opens
 * @param {Function} [params.onError]    – Optional callback on socket error
 * @param {Function} [params.onClose]    – Optional callback on socket close
 *
 * @returns {WebSocket} A WebSocket instance with a buffered `.send()`
 */
export function createChatSocket({
  token,
  userId,
  otherUserId,
  onMessage,
  onOpen,
  onError,
  onClose,
}) {
  const url = `${CHAT_SERVER_URL}?token=${token}&userId=${userId}&otherUserId=${otherUserId}`;
  console.log("[ChatSocket] Connecting to", url);

  const ws = new WebSocket(url);
  let isReady = false;
  const sendQueue = [];

  // send(): buffer until open
  const rawSend = ws.send.bind(ws);
  ws.send = (data) => {
    if (isReady && ws.readyState === WebSocket.OPEN) {
      rawSend(data);
    } else {
      console.log("[ChatSocket] Buffering message until open:", data);
      sendQueue.push(data);
    }
  };

  ws.onopen = () => {
    console.log("[ChatSocket] Connected");
    isReady = true;
    // flush any buffered messages
    sendQueue.forEach((msg) => rawSend(msg));
    sendQueue.length = 0;
    if (onOpen) onOpen();
  };

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch (err) {
      console.warn("[ChatSocket] Invalid JSON message:", event.data);
    }
  };

  ws.onerror = (err) => {
    console.error("[ChatSocket] Error", err);
    if (onError) onError(err);
  };

  ws.onclose = (ev) => {
    console.warn("[ChatSocket] Closed", ev);
    if (onClose) onClose(ev);
  };

  return ws;
}
