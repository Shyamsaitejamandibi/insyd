import { useState, useEffect } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (userId: string | null) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const websocket = new WebSocket("ws://localhost:3001");

    websocket.onopen = () => {
      console.log("WebSocket connected");
      websocket.send(
        JSON.stringify({
          type: "subscribe",
          userId: userId,
        })
      );
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userId]);

  return ws;
};
