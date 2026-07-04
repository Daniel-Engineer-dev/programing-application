// app/api/piston/run/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Tạo instance axios cô lập để tránh header Authorization thừa từ client
const http = axios.create();

// Cấu hình ngôn ngữ và version mà Piston hỗ trợ (Fallback)
const PISTON_CONFIG: Record<string, { language: string; version: string }> = {
  cpp: { language: "c++", version: "10.2.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  javascript: { language: "javascript", version: "18.15.0" },
};

// Cấu hình ID ngôn ngữ của Judge0 CE
const JUDGE0_LANG_IDS: Record<string, number> = {
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  python: 71,     // Python (3.8.1)
};

const JUDGE0_URL = process.env.JUDGE0_API_URL || "http://localhost:2358";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || "";
const JUDGE0_HOST = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
// Token xác thực cho Judge0 tự host (AUTHN_TOKEN trong judge0.conf)
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || "";

const getJudge0Headers = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (JUDGE0_KEY) {
    headers["x-rapidapi-key"] = JUDGE0_KEY;
    headers["x-rapidapi-host"] = JUDGE0_HOST;
  }
  // Judge0 tự host yêu cầu header X-Auth-Token cho mọi request
  if (JUDGE0_AUTH_TOKEN) {
    headers["X-Auth-Token"] = JUDGE0_AUTH_TOKEN;
  }
  return headers;
};

// GET method: Lấy trạng thái xử lý hàng loạt các tokens từ Judge0
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokens = searchParams.get("tokens");

    if (!tokens) {
      return NextResponse.json({ error: "Missing tokens parameter" }, { status: 400 });
    }

    try {
      const response = await http.get(
        `${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=false&fields=token,status_id,status,stdout,stderr,compile_output,time,memory`,
        { headers: getJudge0Headers(), timeout: 5000 }
      );

      const submissions = response.data.submissions || [];
      const results = submissions.map((sub: any, index: number) => {
        const statusId = sub.status_id || 1;
        const finished = statusId !== 1 && statusId !== 2;
        
        let stderr = sub.stderr || "";
        if (sub.compile_output) {
          stderr = sub.compile_output + "\n" + stderr;
        }

        return {
          index,
          token: sub.token,
          status_id: statusId,
          status_name: sub.status?.description || "Unknown",
          finished,
          stdout: sub.stdout || "",
          stderr: stderr,
          code: statusId === 3 ? 0 : 1,
          time: parseFloat(sub.time) || 0,
          memory: parseInt(sub.memory) || 0,
        };
      });

      return NextResponse.json({
        batch: true,
        finished: results.every((r: any) => r.finished),
        results,
      });
    } catch (err: any) {
      console.error("Lỗi khi kết nối với Judge0 GET status:", err.message);
      return NextResponse.json(
        { error: "Lỗi kết nối máy chủ hàng đợi", details: err.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST method: Gửi chạy code (thử gọi Judge0 trước, thất bại tự động chuyển sang Piston)
export async function POST(req: Request) {
  try {
    // 1. Nhận dữ liệu từ Frontend
    const { source_code, language, stdin, problemId, contestId, testCases } =
      await req.json();

    const pistonConfig = PISTON_CONFIG[language];
    if (!pistonConfig) {
      return NextResponse.json(
        { message: "Ngôn ngữ không được hỗ trợ" },
        { status: 400 }
      );
    }

    // 2. Logic tìm Driver Code từ FIRESTORE và Ghép code
    let finalCode = source_code; // Mặc định là code gốc nếu không tìm thấy driver code

    if (problemId) {
      try {
        const docRef = doc(db, "problems", problemId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const driverCodes = data.driverCodes || {};
          const driverTemplate = driverCodes[language];

          if (driverTemplate) {
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
      }
    }

    // 3. Chuẩn bị tên file (Java bắt buộc tên file phải khớp tên class public)
    const fileName = language === "java" ? "Main.java" : "main";

    // 4. KIỂM TRA BATCH TESTCASES
    if (testCases && Array.isArray(testCases) && testCases.length > 0) {
      
      // THỬ NGHIỆM PHƯƠNG ÁN A: Gửi lên Hàng đợi Judge0 CE
      try {
        const submissions = testCases.map((tc: any) => ({
          language_id: JUDGE0_LANG_IDS[language] || 63,
          source_code: finalCode,
          stdin: tc.input || "",
          expected_output: tc.expectedOutput || "",
        }));

        const jResponse = await http.post(
          `${JUDGE0_URL}/submissions/batch?base64_encoded=false`,
          { submissions },
          { headers: getJudge0Headers(), timeout: 2500 } // Timeout ngắn để fallback nhanh
        );

        if (Array.isArray(jResponse.data) && jResponse.data.length > 0 && jResponse.data[0].token) {
          // Trả về token hàng đợi thành công!
          return NextResponse.json({
            batch: true,
            useQueue: true,
            tokens: jResponse.data.map((r: any) => r.token),
            contestId: contestId || null,
            problemId: problemId,
          });
        }
      } catch (jErr: any) {
        console.warn("Judge0 Batch Submission failed. Falling back to Piston:", jErr.message);
      }

      // FALLBACK PHƯƠNG ÁN B: Chạy song song ngay trên Next.js Server qua Piston
      const results = await Promise.all(
        testCases.map(async (tc: any, index: number) => {
          try {
            const response = await http.post(
              "https://emkc.org/api/v2/piston/execute",
              {
                language: pistonConfig.language,
                version: pistonConfig.version,
                files: [{ name: fileName, content: finalCode }],
                stdin: tc.input || "",
              }
            );

            const run = response.data.run || {};
            return {
              index,
              stdout: run.stdout || "",
              stderr: run.stderr || "",
              code: run.code !== undefined ? run.code : 0,
              signal: run.signal || null,
              time: run.time || 0,
              memory: run.memory || 0,
            };
          } catch (err: any) {
            return {
              index,
              stdout: "",
              stderr: err.message || "Lỗi thực thi testcase",
              code: -1,
              signal: null,
              time: 0,
              memory: 0,
            };
          }
        })
      );

      return NextResponse.json({
        batch: true,
        useQueue: false, // Báo cho client biết là đã có kết quả ngay, không cần poll
        results,
        contestId: contestId || null,
        problemId: problemId,
      });
    }

    // 5. CHẠY THỬ ĐƠN LẺ (SINGLE TESTCASE)
    try {
      const response = await http.post(
        `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          language_id: JUDGE0_LANG_IDS[language] || 63,
          source_code: finalCode,
          stdin: stdin || "",
        },
        { headers: getJudge0Headers(), timeout: 3500 }
      );
      const run = response.data;
      let stderr = run.stderr || "";
      if (run.compile_output) {
        stderr = run.compile_output + "\n" + stderr;
      }
      return NextResponse.json({
        stdout: run.stdout || "",
        stderr: stderr,
        code: run.status?.id === 3 ? 0 : 1,
        time: parseFloat(run.time) || 0,
        memory: parseInt(run.memory) || 0,
        contestId: contestId || null,
        problemId: problemId,
      });
    } catch (jErr: any) {
      console.warn("Judge0 Single run failed. Falling back to Piston:", jErr.message);
    }

    // Fallback chạy đơn qua Piston
    const response = await http.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: pistonConfig.language,
        version: pistonConfig.version,
        files: [{ name: fileName, content: finalCode }],
        stdin: stdin || "",
      }
    );

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
