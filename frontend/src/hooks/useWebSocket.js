import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ACCESS_TOKEN } from "../constants";

export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) return;

      const base =
        import.meta.env.VITE_WS_URL ??
        import.meta.env.VITE_API_URL?.replace(/^http/, "ws") ??
        "ws://localhost:8000";

      const ws = new WebSocket(`${base}/ws/notes/?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retriesRef.current = 0;
      };

      ws.onmessage = () => {
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["tags"] });
      };

      ws.onclose = (event) => {
        if (event.code === 4001) return;
        if (event.code === 1000) return;

        const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000);
        retriesRef.current++;
        reconnectRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close(1000);
    };
  }, [queryClient]);
};
