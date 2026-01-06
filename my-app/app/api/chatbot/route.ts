// app/api/chatbot/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Sử dụng generateContentStream để streaming
    const result = await model.generateContentStream(
      `Bạn là trợ lý AI thông minh tích hợp trong nền tảng học lập trình. 
       Hãy trả lời ngắn gọn, tập trung vào giải quyết vấn đề kỹ thuật. 
       Câu hỏi: ${userMessage}`
    );

    // Tạo ReadableStream để stream response về client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            // Gửi từng chunk về client
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return response với streaming
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Gemini API Detail Error:", error);
    return new Response(
      JSON.stringify({
        error: "Lỗi kết nối AI",
        detail: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
