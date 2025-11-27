// =============================================================================
// WebSocket Hook for Real-time Notifications
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';

const DEFAULT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
const EXPLICIT_WS_BASE = import.meta.env.VITE_WS_URL as string | undefined;
const API_BASE = import.meta.env.VITE_API_URL as string | undefined;

const resolveSockJsEndpoint = () => {
  if (EXPLICIT_WS_BASE) {
    return EXPLICIT_WS_BASE;
  }

  if (API_BASE) {
    try {
      const apiUrl = new URL(API_BASE, DEFAULT_ORIGIN);
      apiUrl.pathname = '/ws';
      apiUrl.search = '';
      apiUrl.hash = '';
      return apiUrl.toString();
    } catch {
      // fall through
    }
  }

  return `${DEFAULT_ORIGIN.replace(/\/$/, '')}/ws`;
};

interface OrderNotification {
  type: 'NEW_ORDER' | 'ORDER_STATUS_CHANGED' | 'PAYMENT_CONFIRMED';
  orderId: number;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  timestamp: string;
}

interface UseWebSocketOptions {
  dept: string;
  onNewOrder?: (notification: OrderNotification) => void;
  onOrderStatusChanged?: (notification: OrderNotification) => void;
  onPaymentConfirmed?: (notification: OrderNotification) => void;
  enabled?: boolean;
}

export function useWebSocket({
  dept,
  onNewOrder,
  onOrderStatusChanged,
  onPaymentConfirmed,
  enabled = true,
}: UseWebSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const subscriptionsRef = useRef<any[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  
  // Refs for callbacks to avoid dependency issues
  const onNewOrderRef = useRef(onNewOrder);
  const onOrderStatusChangedRef = useRef(onOrderStatusChanged);
  const onPaymentConfirmedRef = useRef(onPaymentConfirmed);

  // Update refs when callbacks change
  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
    onOrderStatusChangedRef.current = onOrderStatusChanged;
    onPaymentConfirmedRef.current = onPaymentConfirmed;
  }, [onNewOrder, onOrderStatusChanged, onPaymentConfirmed]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    subscriptionsRef.current.forEach((sub) => {
      try {
        sub?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    });
    subscriptionsRef.current = [];

    if (clientRef.current) {
      try {
        clientRef.current.disconnect?.();
      } catch (e) {
        // ignore
      }
      clientRef.current = null;
    }
    isConnectingRef.current = false;
    setConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (!enabled || !dept) {
      return;
    }

    // 이미 연결 중이거나 연결됨
    if (isConnectingRef.current || clientRef.current?.connected) {
      return;
    }

    isConnectingRef.current = true;

    try {
      // Dynamic import for SockJS and Stomp
      const SockJS = (await import('sockjs-client')).default;
      const { Stomp } = await import('@stomp/stompjs');

      const wsUrl = resolveSockJsEndpoint();
      const socket = new SockJS(wsUrl);
      const stompClient = Stomp.over(() => socket);

      // Disable debug logs
      stompClient.debug = () => {};

      // 연결 타임아웃 설정
      const connectionTimeout = setTimeout(() => {
        if (!clientRef.current?.connected) {
          console.warn('WebSocket connection timeout');
          setError('연결 시간 초과');
          setConnected(false);
          isConnectingRef.current = false;
        }
      }, 10000);

      stompClient.connect(
        {},
        () => {
          clearTimeout(connectionTimeout);
          setConnected(true);
          setError(null);
          clientRef.current = stompClient;
          isConnectingRef.current = false;

          // Subscribe to order notifications
          try {
            const orderSub = stompClient.subscribe(`/topic/${dept}/orders`, (message: any) => {
              try {
                const notification: OrderNotification = JSON.parse(message.body);
                
                if (notification.type === 'NEW_ORDER' && onNewOrderRef.current) {
                  onNewOrderRef.current(notification);
                } else if (notification.type === 'ORDER_STATUS_CHANGED' && onOrderStatusChangedRef.current) {
                  onOrderStatusChangedRef.current(notification);
                } else if (notification.type === 'PAYMENT_CONFIRMED' && onPaymentConfirmedRef.current) {
                  onPaymentConfirmedRef.current(notification);
                }
              } catch (e) {
                console.error('Failed to parse notification:', e);
              }
            });
            subscriptionsRef.current.push(orderSub);
          } catch (e) {
            console.error('Failed to subscribe:', e);
          }
        },
        (err: any) => {
          clearTimeout(connectionTimeout);
          console.warn('WebSocket connection error:', err);
          setError('연결 실패');
          setConnected(false);
          isConnectingRef.current = false;
          
          // 5초 후 재연결 시도
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000);
        }
      );
    } catch (err) {
      console.warn('Failed to initialize WebSocket:', err);
      setError('WebSocket 미지원');
      setConnected(false);
      isConnectingRef.current = false;
    }
  }, [dept, enabled]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    error,
    reconnect: connect,
  };
}

// Hook for subscribing to specific order updates (for guest waiting page)
export function useOrderStatusSubscription(orderId: number | null, onUpdate: (notification: any) => void) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<any>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!orderId) return;

    let subscription: any = null;
    let isMounted = true;

    const connect = async () => {
      try {
        const SockJS = (await import('sockjs-client')).default;
        const { Stomp } = await import('@stomp/stompjs');

        const socket = new SockJS(resolveSockJsEndpoint());
        const stompClient = Stomp.over(() => socket);
        stompClient.debug = () => {};
        clientRef.current = stompClient;

        stompClient.connect(
          {},
          () => {
            if (!isMounted) return;
            setConnected(true);
            subscription = stompClient.subscribe(`/topic/orders/${orderId}`, (message: any) => {
              try {
                const data = JSON.parse(message.body);
                onUpdateRef.current(data);
              } catch (e) {
                console.error('Failed to parse order update:', e);
              }
            });
          },
          () => {
            if (isMounted) setConnected(false);
          }
        );
      } catch (e) {
        console.warn('WebSocket not available:', e);
        if (isMounted) setConnected(false);
      }
    };

    connect();

    return () => {
      isMounted = false;
      try {
        subscription?.unsubscribe?.();
        clientRef.current?.disconnect?.();
      } catch (e) {
        // ignore
      }
    };
  }, [orderId]);

  return { connected };
}
