import { useCallback } from "react";
import { useOpenAiGlobal } from "./use-openai-global";

/**
 * Hook para gerenciar o estado do widget
 */
export function useWidgetState<T = any>() {
  const widgetState = useOpenAiGlobal("widgetState") as T | null;
  const setWidgetStateFn = useOpenAiGlobal("setWidgetState");

  const setWidgetState = useCallback(
    async (state: T): Promise<void> => {
      if (!setWidgetStateFn) {
        console.warn("setWidgetState not available");
        return;
      }

      try {
        await setWidgetStateFn(state);
      } catch (error) {
        console.error("Error setting widget state:", error);
      }
    },
    [setWidgetStateFn]
  );

  const updateWidgetState = useCallback(
    async (updater: (prevState: T | null) => T): Promise<void> => {
      const newState = updater(widgetState);
      await setWidgetState(newState);
    },
    [widgetState, setWidgetState]
  );

  return {
    widgetState,
    setWidgetState,
    updateWidgetState,
  };
}
