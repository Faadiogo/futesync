import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
        
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case "NEW_MATCH":
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        break;
      case "MATCH_UPDATED":
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        break;
      case "NEW_POST":
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
        break;
      case "CONFIRMATION_UPDATED":
        queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  return { isConnected };
}
