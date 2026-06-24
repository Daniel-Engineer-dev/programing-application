const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function migrateTestCases() {
    console.log('🚀 Bắt đầu tạo sub-collection testCases...');

    try {
        const snapshot = await db.collection('problems').get();
        if (snapshot.empty) {
            console.log('❌ Không tìm thấy documents nào.');
            return;
        }

        console.log(`📦 Tìm thấy ${snapshot.size} bài tập.`);

        let batch = db.batch();
        let batchCount = 0;
        let totalCases = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const examples = data.examples || [];
            
            if (examples.length === 0) continue;

            for (let i = 0; i < examples.length; i++) {
                const ex = examples[i];
                const caseId = `case-${i + 1}`;
                
                // Reference to the new document in sub-collection
                const tcRef = db.collection('problems').doc(doc.id).collection('testCases').doc(caseId);

                // Data structure requested by user
                const testCaseData = {
                    id: caseId,
                    input: ex.input || "",
                    expectedOutput: ex.output || "",
                    isHidden: false 
                };

                batch.set(tcRef, testCaseData);
                batchCount++;
                totalCases++;

                if (batchCount >= 400) {
                    await batch.commit();
                    console.log(`💾 Đã lưu một batch ${batchCount} test cases...`);
                    batch = db.batch();
                    batchCount = 0;
                }
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 HOÀN THÀNH!`);
        console.log(`📊 Tổng số Test Case đã tạo: ${totalCases}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Lỗi:', error);
    }
}

migrateTestCases();
