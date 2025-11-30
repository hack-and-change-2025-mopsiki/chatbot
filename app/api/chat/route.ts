import { NextRequest, NextResponse } from "next/server";
import { marked } from "marked";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const getAllItems = async (datasetName: string) => {
  const allRecords: {
    fields: Record<string, unknown>;
  }[] = [];
  let pageNum = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const url = new URL(
      `https://tables.mws.ru/fusion/v1/datasheets/${
        datasetName.split("/")[0]
      }/records`
    );
    url.searchParams.set("viewId", datasetName.split("/")[1]);
    url.searchParams.set("fieldKey", "name");
    url.searchParams.set("pageNum", pageNum.toString());
    url.searchParams.set("pageSize", pageSize.toString());

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MWS_API_KEY}`,
        },
      });

      if (!res.ok) {
        console.log(await res.text());
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as {
        code: number;
        success: boolean;
        message: string;
        data: {
          total: number;
          pageNum: number;
          pageSize: number;
          records: { fields: Record<string, unknown> }[];
        };
      };

      if ((data.data.records.length as number) === 0) {
        hasMore = false;
      } else {
        allRecords.push(...data.data.records);
        pageNum++;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching watchable posts (page ${pageNum}):`, error);
      throw error;
    }
  }

  return {
    code: 200,
    success: true,
    message: "All posts fetched successfully",
    data: {
      total: allRecords.length,
      pageNum: 1,
      pageSize: allRecords.length,
      records: allRecords,
    },
  };
};

const fieldsToCSV = (records: { fields: Record<string, unknown> }[]) => {
  if (records.length === 0) return "";
  const headers = Object.keys(records[0].fields);
  const csvRows = records.map((record) =>
    headers.map((header) => record.fields[header]).join(",")
  );
  return [headers.join(","), ...csvRows].join("\n");
};

/**
 * POST /api/chat
 * Receives chat message history, adds assistant message placeholder,
 * and streams OpenRouter API response to client
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const {
      messages,
      model = "x-ai/grok-4.1-fast:free",
      temperature = 0.3,
      maxTokens = 2048,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Format messages for OpenRouter API
    const formattedMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const postsData = (await getAllItems(process.env.MWS_POSTS_API_URL!)).data
      .records;
    const commentsData = (await getAllItems(process.env.MWS_COMMENTS_API_URL!))
      .data.records;

    formattedMessages.push({
      role: "assistant",
      content:
        "НЕ ОТВЕЧАЙ НА ВОПРОСЫ, НЕ СВЯЗАННЫЕ С АНАЛИЗОМ ИЛИ КОНТЕНТОМ. " +
        'Если не уверен, пиши "Я не могу ответить на этот вопрос сейчас ;-;"\n\n' +
        "Ты можешь использовать следующие датасеты:\n" +
        "- Посты\n\n" +
        "csv```\n" +
        fieldsToCSV(postsData) +
        "\n```\n\n" +
        "Комментарии:\n\n" +
        "csv```\n" +
        fieldsToCSV(commentsData) +
        "\n```" +
        "Отвечай максимально лакончино и только на то, что пользователь спросил. " +
        "Не задавай вопросы пользователю." +
        'Ты - помощник для анализа данных из таблиц, название - "мопсики agi"',
    });

    console.log({
      model,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    // Make request to OpenRouter with streaming
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      return NextResponse.json(
        { error: "Failed to get response from OpenRouter" },
        { status: response.status }
      );
    }

    // Create a readable stream from the response
    const { body: responseBody } = response;
    if (!responseBody) {
      return NextResponse.json(
        { error: "No response body from OpenRouter" },
        { status: 500 }
      );
    }

    // Stream the response back to client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = responseBody.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  controller.enqueue("event: done\ndata: null\n\n");
                } else if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || "";
                    if (content) {
                      // Convert markdown to HTML
                      const htmlContent = marked.parse(content);
                      controller.enqueue(
                        `event: message\ndata: ${JSON.stringify({
                          content,
                          html: htmlContent,
                        })}\n\n`
                      );
                    }
                  } catch (e) {
                    console.error("Failed to parse stream data:", e);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
