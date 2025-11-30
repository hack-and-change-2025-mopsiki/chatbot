import { useCallback } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseStreamChatOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Hook for streaming chat responses from the API
 * Handles SSE (Server-Sent Events) connection and data parsing
 */
export function useStreamChat({
  onChunk,
  onComplete,
  onError,
  model,
  temperature,
  maxTokens,
}: UseStreamChatOptions = {}) {
  const sendMessage = useCallback(
    async (messages: ChatMessage[]) => {
      let fullResponse = '';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            model,
            temperature,
            maxTokens,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onComplete?.(fullResponse);
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === 'null' || data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || '';
                if (content) {
                  fullResponse += content;
                  onChunk?.(content);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }

        return fullResponse;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        throw err;
      }
    },
    [model, temperature, maxTokens, onChunk, onComplete, onError]
  );

  return { sendMessage };
}
