// list-models.js
const dotenv = require("dotenv");
const axios = require("axios");

// 1. Nạp biến môi trường từ file .env
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env");
  process.exit(1);
}

async function listModels() {
  console.log("⏳ Đang truy vấn danh sách model từ Google...");
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);

    const models = response.data.models;

    console.log("\n✅ DANH SÁCH CÁC MODEL KHẢ DỤNG CHO KEY CỦA BẠN:");
    console.log("--------------------------------------------------");

    models.forEach((m, index) => {
      // Chỉ lọc các model hỗ trợ tạo nội dung (generateContent)
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(
          `${index + 1}. Tên định danh: ${m.name.replace("models/", "")}`
        );
        console.log(`   Mô tả: ${m.displayName}`);
        console.log("--------------------------------------------------");
      }
    });
  } catch (error) {
    if (error.response) {
      console.error("❌ Lỗi từ Google API:", error.response.data.error.message);
    } else {
      console.error("❌ Lỗi kết nối:", error.message);
    }
  }
}

listModels();
