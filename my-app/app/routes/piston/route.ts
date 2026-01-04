// app/api/piston/run/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
// 1. Import Firebase thay vì file data tĩnh
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

// Cấu hình ngôn ngữ và version mà Piston hỗ trợ
const PISTON_CONFIG: Record<string, { language: string; version: string }> = {
  cpp: { language: "c++", version: "10.2.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  javascript: { language: "javascript", version: "18.15.0" },
};

export async function POST(req: Request) {
  try {
    // 1. Nhận dữ liệu từ Frontend
    const { source_code, language, stdin, problemId, contestId } =
      await req.json();

    const config = PISTON_CONFIG[language];
    if (!config) {
      return NextResponse.json(
        { message: "Ngôn ngữ không được hỗ trợ" },
        { status: 400 }
      );
    }

    // 2. Logic tìm Driver Code từ FIRESTORE và Ghép code
    let finalCode = source_code; // Mặc định là code gốc nếu không tìm thấy driver code

    if (problemId) {
      try {
        // Tham chiếu đến document bài toán trong collection "problems"
        const docRef = doc(db, "problems", problemId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Lấy Map 'driverCodes' từ Firestore (nhớ tạo field này trên Console nếu chưa có)
          // Cấu trúc mong đợi: driverCodes: { cpp: "...", java: "..." }
          const driverCodes = data.driverCodes || {};
          const driverTemplate = driverCodes[language];

          if (driverTemplate) {
            // Thực hiện thay thế placeholder bằng code user
            finalCode = driverTemplate
              .replace("// __USER_CODE_HERE__", source_code) // Cho C++, Java, JS
              .replace("# __USER_CODE_HERE__", source_code); // Cho Python
          } else {
            console.warn(
              `Không tìm thấy driver code cho ngôn ngữ ${language} trong bài ${problemId}`
            );
          }
        } else {
          console.warn(`Không tìm thấy bài tập với ID: ${problemId}`);
        }
      } catch (dbError) {
        console.error("Lỗi khi đọc Firestore:", dbError);
        // Không return lỗi ngay mà có thể chạy code gốc để fallback (hoặc return lỗi tùy bạn)
      }
    }

    // 3. Chuẩn bị tên file (Java bắt buộc tên file phải khớp tên class public)
    const fileName = language === "java" ? "Main.java" : "main";

    // 4. Gửi request tới Piston API
    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: config.language,
        version: config.version,
        files: [
          {
            name: fileName,
            content: finalCode, // Gửi code ĐÃ GHÉP sang Piston
          },
        ],
        stdin: stdin || "", // Input đầu vào
      }
    );

    // Piston trả về object { run: { stdout, stderr, code, ... } }
    return NextResponse.json({
      ...response.data.run,
      contestId: contestId || null,
      problemId: problemId,
    });
  } catch (error: any) {
    console.error("Error executing code:", error);
    return NextResponse.json(
      { message: "Lỗi server khi chạy code", error: error.message },
      { status: 500 }
    );
  }
}
