import { CHAT_SERVER_URL } from "@env";

// Initialize a WebSocket connection to your own server.
// Expects query‐params: token (for auth) and room (user1–user2 pair or chat id).
export function createChatSocket({
  token,
  userId,
  otherUserId,
  onMessage,
  onOpen,
  onError,
}) {
  const url = `${CHAT_SERVER_URL}?token=${token}&userId=${userId}&otherUserId=${otherUserId}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("Chat WebSocket connected");
    if (onOpen) onOpen();
  };
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch (e) {
      console.warn("Invalid WS message", event.data);
    }
  };
  ws.onerror = (err) => {
    console.error("Chat WebSocket error", err);
    if (onError) onError(err);
  };
  return ws;
}
