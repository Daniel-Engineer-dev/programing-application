// app/api/run/route.ts
import { NextResponse } from "next/server";
import axios from "axios";

// Cấu hình ngôn ngữ và version mà Piston hỗ trợ
const PISTON_CONFIG: Record<string, { language: string; version: string }> = {
  cpp: { language: "c++", version: "10.2.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  javascript: { language: "javascript", version: "18.15.0" },
};

export async function POST(req: Request) {
  try {
    const { source_code, language, stdin } = await req.json();

    const config = PISTON_CONFIG[language];

    if (!config) {
      return NextResponse.json(
        { message: "Ngôn ngữ không được hỗ trợ" },
        { status: 400 }
      );
    }

    // Gửi request tới Piston API
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language: config.language,
      version: config.version,
      files: [
        {
          name: "main", // Java yêu cầu tên file trùng tên class (thường là Main)
          content: source_code,
        },
      ],
      stdin: stdin || "", // Input đầu vào (nếu có)
    });

    // Piston trả về object { run: { stdout, stderr, code, ... } }
    return NextResponse.json(response.data.run);

  } catch (error: any) {
    console.error("Error executing code:", error);
    return NextResponse.json(
      { message: "Lỗi server khi chạy code", error: error.message },
      { status: 500 }
    );
  }
}