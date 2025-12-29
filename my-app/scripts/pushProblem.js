/* eslint-disable @typescript-eslint/no-require-imports */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function pushProblemsFromDirectory() {
  const dataDir = path.join(__dirname, "data");
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

  console.log(`🚀 Tìm thấy ${files.length} bài tập. Bắt đầu đẩy dữ liệu...`);

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const problemData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    try {
      const batch = db.batch();
      const problemId = problemData.id;
      const problemRef = db.collection("problems").doc(problemId);

      // 1. Tách Test Cases ra khỏi object chính để push vào sub-collection
      const { testCases, ...mainData } = problemData;

      // 2. Set dữ liệu bài tập chính
      batch.set(problemRef, {
        ...mainData,
        likes: [],
        stars: [],
        dislikes: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        editorial: {
          ...mainData.editorial,
          lastUpdated: new Date(),
        },
      });

      // 3. Set Test Cases vào sub-collection
      if (testCases && Array.isArray(testCases)) {
        testCases.forEach((tc, index) => {
          const tcRef = problemRef
            .collection("testCases")
            .doc(`testCase${index + 1}`);
          batch.set(tcRef, tc);
        });
      }

      await batch.commit();
      console.log(`✅ Thành công: ${problemId}`);
    } catch (error) {
      console.error(`❌ Lỗi tại bài ${file}:`, error.message);
    }
  }

  console.log("🏁 Hoàn tất quá trình push dữ liệu!");
}

pushProblemsFromDirectory().then(() => process.exit());
