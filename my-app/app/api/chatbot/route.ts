// app/api/chat/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
console.log("Key:", process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    // Lấy tin nhắn cuối cùng từ người dùng
    const userMessage = messages[messages.length - 1].content;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    // Bạn có thể thêm System Instruction để AI biết nó là trợ lý lập trình
    const result = await model.generateContent(
      `Bạn là trợ lý AI thông minh tích hợp trong nền tảng học lập trình. 
       Hãy trả lời ngắn gọn, tập trung vào giải quyết vấn đề kỹ thuật. 
       Câu hỏi: ${userMessage}`
    );

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
    // Sửa lại đoạn cuối file route.ts để debug
  } catch (error: any) {
    console.error("Gemini API Detail Error:", error);
    return NextResponse.json(
      {
        error: "Lỗi kết nối AI",
        detail: error.message, // Trả về thông tin lỗi cụ thể để xem ở tab Network
      },
      { status: 500 }
    );
  }
}
