// Script to reorder Firestore documents by createdAt
// Usage: node scripts/reorderProblemsById.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function reorderProblems() {
    console.log('🚀 Bắt đầu quá trình sắp xếp lại documents...');

    try {
        // 1. Lấy tất cả documents từ collection 'problems'
        const snapshot = await db.collection('problems').get();
        
        if (snapshot.empty) {
            console.log('❌ Không tìm thấy documents nào.');
            return;
        }

        console.log(`📦 Tìm thấy ${snapshot.size} bài tập.`);

        // 2. Chuyển đổi sang mảng và sắp xếp theo createdAt
        const problems = [];
        snapshot.forEach(doc => {
            problems.push({
                oldId: doc.id,
                data: doc.data()
            });
        });

        // Sắp xếp: Cũ nhất lên đầu (index nhỏ), Mới nhất xuống dưới (index lớn) -> ascending
        problems.sort((a, b) => {
            const timeA = a.data.createdAt?._seconds || 0;
            const timeB = b.data.createdAt?._seconds || 0;
            return timeA - timeB;
        });

        console.log('✅ Đã sắp xếp xong dữ liệu trong bộ nhớ.');

        // 3. Thực hiện migration (Tạo mới & Xóa cũ)
        let count = 0;
        const batchSize = 400; // Batch write limit is 500
        let batch = db.batch();
        let batchCount = 0;

        for (let i = 0; i < problems.length; i++) {
            const problem = problems[i];
            const oldId = problem.oldId;
            
            // Xử lý slug từ title hoặc dùng oldId bỏ phần số cũ
            // Ví dụ oldId: "1-two-sum" -> cleanId: "two-sum"
            let cleanId = oldId;
            if (/^\d+-/.test(oldId)) {
                cleanId = oldId.replace(/^\d+-/, ''); // Remove existing prefix
            }

            // Tạo ID mới với prefix số thứ tự (1-based index)
            // Format: "1-two-sum", "2-add-two-numbers"...
            const newId = `${i + 1}-${cleanId}`;

            // Nếu ID mới trùng ID cũ (đã đúng thứ tự), bỏ qua
            if (newId === oldId) {
                console.log(`⏭️  [${i + 1}] Document "${newId}" đã đúng vị trí.`);
                continue;
            }

            const newDocRef = db.collection('problems').doc(newId);
            const oldDocRef = db.collection('problems').doc(oldId);

            // Set new doc
            batch.set(newDocRef, {
                ...problem.data,
                id: newId // Update ID field inside document as well
            });

            // Delete old doc
            batch.delete(oldDocRef);

            count++;
            batchCount++;

            console.log(`🔄 [${i + 1}] Migrating: ${oldId} -> ${newId}`);

            // Commit batch nếu đủ 400 operations
            if (batchCount >= batchSize) {
                await batch.commit();
                console.log('💾 Đã lưu một batch...');
                batch = db.batch();
                batchCount = 0;
            }
        }

        // Commit batch cuối cùng
        if (batchCount > 0) {
            await batch.commit();
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 HOÀN THÀNH!`);
        console.log(`📊 Tổng số bài tập: ${problems.length}`);
        console.log(`🔄 Số bài đã đổi ID: ${count}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

reorderProblems();
