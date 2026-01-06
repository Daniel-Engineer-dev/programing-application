/* eslint-disable @typescript-eslint/no-require-imports */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function pushArticles() {
  const articlesPath = path.join(__dirname, "articles.json");
  const articles = JSON.parse(fs.readFileSync(articlesPath, "utf8"));

  console.log(`🚀 Tìm thấy ${articles.length} bài báo. Bắt đầu đẩy dữ liệu...`);

  try {
    const batch = db.batch();

    for (const article of articles) {
      const articleRef = db.collection("articles").doc(article.id.toString());
      
      batch.set(articleRef, {
        ...article,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log(`✅ Đã thêm: ${article.title}`);
    }

    await batch.commit();
    console.log("🏁 Hoàn tất quá trình push dữ liệu!");
  } catch (error) {
    console.error("❌ Lỗi khi push dữ liệu:", error.message);
  }
}

pushArticles().then(() => process.exit());
