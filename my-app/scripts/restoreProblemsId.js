// Script to restore Firestore documents ID based on JSON file
// Usage: node scripts/restoreProblemsId.js

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Đọc file JSON gốc để lấy ID chuẩn
const problemsFilePath = path.join(__dirname, 'leetcode_questions_with_editorial_vi.json');
const problemsData = JSON.parse(fs.readFileSync(problemsFilePath, 'utf-8'));

// Tạo map: Title -> Original ID & Data
// Lưu ý: ID gốc này phụ thuộc vào cách bạn đã push lần trước.
// Nếu lần trước bạn push bắt đầu từ 76, 77... thì script này sẽ cần logic đó.
// Tuy nhiên, dựa vào log output của bạn, có vẻ ID cũ là "2-add...", "25-reverse..."
// Nên tôi sẽ tìm cách khôi phục lại ID dựa trên log logic của bạn.
// Nếu bạn muốn quay lại trạng thái "chuẩn" từ file JSON (ví dụ bắt đầu từ 76), thì hãy sửa START_SEQUENCE.

// Trong log bạn gửi: 
// 2-add-two-numbers -> 1-add-two-numbers
// 25-reverse... -> 2-reverse...
// Có vẻ list cũ không theo thứ tự file JSON (vì trong JSON, add-two-numbers là bài số 2).

// GIẢI PHÁP AN TOÀN NHẤT:
// Xóa hết và push lại từ đầu là sạch nhất.
// Nhưng nếu bạn muốn giữ data (createdAt, custom edits), tôi sẽ dùng strategy:
// Match bằng Title -> Lấy ID từ JSON -> Tạo lại ID theo format sequence-id

const START_SEQUENCE = 76; // Sequence bạn dùng trong script pushProblemsFromJSON.js

async function restoreProblems() {
    console.log('🚀 Bắt đầu khôi phục ID documents...');

    try {
        // 1. Lấy tất cả documents hiện tại (đang bị reorder)
        const snapshot = await db.collection('problems').get();
        
        if (snapshot.empty) {
            console.log('❌ Không tìm thấy documents nào.');
            return;
        }

        console.log(`📦 Đang xử lý ${snapshot.size} bài tập từ Firestore...`);

        // Map Title -> Firestore Doc
        const firestoreMap = new Map();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.title) {
                firestoreMap.set(data.title, {
                    currentId: doc.id,
                    data: data
                });
            }
        });

        let count = 0;
        const batchSize = 400;
        let batch = db.batch();
        let batchCount = 0;

        // 2. Duyệt qua file JSON gốc để lấy thứ tự chuẩn và ID gốc
        for (let i = 0; i < problemsData.length; i++) {
            const jsonProblem = problemsData[i];
            const title = jsonProblem.title;
            
            // Tìm document tương ứng trong Firestore
            const firestoreDoc = firestoreMap.get(title);

            if (!firestoreDoc) {
                console.log(`⚠️ Không tìm thấy bài trên Firestore: "${title}"`);
                continue;
            }

            // ID gốc mong muốn (như logic của script push)
            // Nếu bạn muốn ID khác, hãy sửa dòng này.
            // Ví dụ: logic cũ là sequence bắt đầu từ 76
            const originalId = `${START_SEQUENCE + i}-${jsonProblem.id}`;
            const currentId = firestoreDoc.currentId;

            // Nếu ID đã đúng rồi thì thôi
            if (currentId === originalId) {
                // console.log(`✅ [${title}] ID đã đúng: ${currentId}`);
                continue;
            }

            console.log(`REVERT: ${currentId} -> ${originalId}`);

            const newDocRef = db.collection('problems').doc(originalId);
            const oldDocRef = db.collection('problems').doc(currentId);

            batch.set(newDocRef, {
                ...firestoreDoc.data,
                id: originalId // Update lại field id bên trong
            });

            batch.delete(oldDocRef);

            count++;
            batchCount++;

            if (batchCount >= batchSize) {
                await batch.commit();
                console.log('💾 Đã lưu một batch...');
                batch = db.batch();
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 HOÀN THÀNH KHÔI PHỤC!`);
        console.log(`🔄 Số bài đã đổi lại ID: ${count}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

restoreProblems();
