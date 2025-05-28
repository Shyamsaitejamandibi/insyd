import { useState, useEffect, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (userId: string | null) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!userId) return;

    const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE || "ws://localhost:3001";
    const websocket = new WebSocket(WS_BASE);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      websocket.send(
        JSON.stringify({
          type: "subscribe",
          userId: userId,
        })
      );
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      websocket.close();
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userId]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  return ws;
};
