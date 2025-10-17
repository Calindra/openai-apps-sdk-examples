import { useCallback } from "react";
import { useOpenAiGlobal } from "./use-openai-global";
import { CallToolResponse, DisplayMode } from "@/types/openai";

/**
 * Hook para acessar as funcionalidades do OpenAI
 */
export function useOpenAI() {
  // Verifica se o OpenAI está disponível
  const isAvailable = typeof window !== "undefined" && !!window.openai;

  /**
   * Chama uma tool do OpenAI
   */
  const callTool = useCallback(
    async <T = any>(
      name: string,
      args: Record<string, unknown> = {}
    ): Promise<T | null> => {
      if (!isAvailable) {
        console.warn("OpenAI not available");
        return null;
      }

      try {
        const response: CallToolResponse = await window.openai.callTool(
          name,
          args
        );
        return JSON.parse(response.result) as T;
      } catch (error) {
        console.error(`Error calling tool ${name}:`, error);
        return null;
      }
    },
    [isAvailable]
  );

  /**
   * Envia uma mensagem de follow-up
   */
  const sendFollowUpMessage = useCallback(
    async (prompt: string): Promise<void> => {
      if (!isAvailable) {
        console.warn("OpenAI not available");
        return;
      }

      try {
        await window.openai.sendFollowUpMessage({ prompt });
      } catch (error) {
        console.error("Error sending follow-up message:", error);
      }
    },
    [isAvailable]
  );

  /**
   * Abre um link externo
   */
  const openExternal = useCallback(
    (href: string): void => {
      if (!isAvailable) {
        console.warn("OpenAI not available");
        return;
      }

      try {
        window.openai.openExternal({ href });
      } catch (error) {
        console.error("Error opening external link:", error);
      }
    },
    [isAvailable]
  );

  /**
   * Solicita mudança no modo de exibição
   */
  const requestDisplayMode = useCallback(
    async (mode: DisplayMode): Promise<DisplayMode | null> => {
      if (!isAvailable) {
        console.warn("OpenAI not available");
        return null;
      }

      try {
        const response = await window.openai.requestDisplayMode({ mode });
        return response.mode;
      } catch (error) {
        console.error("Error requesting display mode:", error);
        return null;
      }
    },
    [isAvailable]
  );

  const getToolInput = useCallback((): string | null => {
    if (!isAvailable) {
      console.warn("OpenAI not available");
      return null;
    }

    try {
      const response = window.openai.toolInput as {
        query?: string;
        intention?: string;
      };
      return response.query;
    } catch (error) {
      console.error("Error getting tool input:", error);
      return null;
    }
  }, [isAvailable]);

  return {
    isAvailable,
    callTool,
    sendFollowUpMessage,
    openExternal,
    requestDisplayMode,
    getToolInput,
  };
}
