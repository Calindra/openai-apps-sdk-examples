import { useState, useCallback } from "react";
import { useOpenAI } from "./useOpenAI";

interface UseToolCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  autoLoad?: boolean;
}

type AvailableTools =
  | "searchProducts"
  | "getProduct"
  | "getCart"
  | "addToCart"
  | "removeItemsFromCart"
  | "listOrders"
  | "getOrder"
  | "getProfile"
  | "updateProfile";

/**
 * Hook para gerenciar chamadas de tools com estado de loading e erro
 */
export function useToolCall<T = any>(
  toolName: AvailableTools,
  defaultArgs: Record<string, unknown> = {},
  options: UseToolCallOptions<T> = {}
) {
  const { callTool } = useOpenAI();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (args: Record<string, unknown> = defaultArgs) => {
      setLoading(true);
      setError(null);

      try {
        const result = await callTool<T>(toolName, args);

        if (result === null) {
          throw new Error(`Failed to call tool: ${toolName}`);
        }

        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toolName, defaultArgs, callTool, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
