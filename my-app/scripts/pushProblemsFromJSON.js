// Script to push problems from JSON to Firestore
// Usage: node scripts/pushProblemsFromJSON.js

require('dotenv').config();

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read problems from JSON file
const problemsFilePath = path.join(__dirname, 'leetcode_questions_with_editorial_vi.json');
const problems = JSON.parse(fs.readFileSync(problemsFilePath, 'utf-8'));

// Starting sequence number
const START_SEQUENCE = 76;

async function checkTitleExists(title) {
  const snapshot = await db.collection('problems')
    .where('title', '==', title)
    .limit(1)
    .get();
  return !snapshot.empty;
}

async function pushProblems() {
  console.log(`📚 Tổng số bài tập trong file: ${problems.length}`);
  console.log('🔍 Bắt đầu kiểm tra và push...\n');

  let addedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < problems.length; i++) {
    const problem = problems[i];
    const sequenceNumber = START_SEQUENCE + i;
    const docId = `${sequenceNumber}-${problem.id}`;

    try {
      // Check if problem with same title already exists
      const exists = await checkTitleExists(problem.title);
      
      if (exists) {
        console.log(`⏭️  [${sequenceNumber}] "${problem.title}" - Đã tồn tại, bỏ qua`);
        skippedCount++;
        continue;
      }

      // Prepare problem data
      const problemData = {
        id: docId,
        title: problem.title,
        description: problem.description || '',
        constraints: problem.constraints || [],
        examples: problem.examples || [],
        difficulty: problem.difficulty || 'Easy',
        tags: problem.tags || [],
        acceptance: problem.acceptance || 0,
        likes: problem.likes || 0,
        dislikes: problem.dislikes || 0,
        content: problem.content || '',
        defaultCode: problem.defaultCode || {},
        editorial: problem.editorial || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Push to Firestore
      await db.collection('problems').doc(docId).set(problemData);
      console.log(`✅ [${sequenceNumber}] "${problem.title}" - Đã thêm thành công`);
      addedCount++;

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ [${sequenceNumber}] "${problem.title}" - Lỗi:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 KẾT QUẢ:');
  console.log(`   ✅ Đã thêm: ${addedCount} bài`);
  console.log(`   ⏭️  Bỏ qua (đã tồn tại): ${skippedCount} bài`);
  console.log(`   ❌ Lỗi: ${errorCount} bài`);
  console.log('='.repeat(50));
}

// Run the script
pushProblems()
  .then(() => {
    console.log('\n🎉 Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Lỗi nghiêm trọng:', error);
    process.exit(1);
  });
