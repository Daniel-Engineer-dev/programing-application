// Script to update defaultCode and driverCodes for problems
// Usage: 
//   node scripts/updateDriverAndDefaultCode.js <problemId>   (single update)
//   node scripts/updateDriverAndDefaultCode.js --batch       (update all problems in JSON)

const admin = require('firebase-admin');
const readline = require('readline');
const serviceAccount = require('./serviceAccountKey.json');
const codeData = require('./driverAnDefaultCode.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function updateProblem(problemId, defaultCode, driverCodes) {
    console.log(`\n🔍 Đang tìm bài tập: ${problemId}...`);

    try {
        const docRef = db.collection('problems').doc(problemId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log(`❌ Không tìm thấy bài tập với ID: ${problemId}`);
            return false;
        }

        console.log(`✅ Đã tìm thấy: ${docSnap.data().title || problemId}`);

        await docRef.update({
            defaultCode: defaultCode,
            driverCodes: driverCodes
        });

        console.log('🎉 Đã cập nhật thành công!');
        return true;

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        return false;
    }
}

async function batchUpdate() {
    console.log('='.repeat(50));
    console.log('📝 BATCH UPDATE - Cập nhật tất cả bài trong JSON');
    console.log('='.repeat(50));

    const problems = codeData.problems;
    if (!problems) {
        console.log('❌ Không tìm thấy key "problems" trong file JSON');
        return;
    }

    const problemIds = Object.keys(problems);
    console.log(`📦 Tìm thấy ${problemIds.length} bài tập cần cập nhật.\n`);

    let success = 0;
    let failed = 0;

    for (const id of problemIds) {
        const data = problems[id];
        const result = await updateProblem(id, data.defaultCode, data.driverCodes);
        if (result) success++;
        else failed++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 HOÀN THÀNH BATCH UPDATE!`);
    console.log(`   ✅ Thành công: ${success}`);
    console.log(`   ❌ Thất bại: ${failed}`);
    console.log('='.repeat(50));
}

async function singleUpdate(problemId) {
    // Check if problemId exists in new format (problems object)
    if (codeData.problems && codeData.problems[problemId]) {
        const data = codeData.problems[problemId];
        await updateProblem(problemId, data.defaultCode, data.driverCodes);
    } 
    // Fallback to old format (direct defaultCode/driverCodes)
    else if (codeData.defaultCode && codeData.driverCodes) {
        await updateProblem(problemId, codeData.defaultCode, codeData.driverCodes);
    } 
    else {
        console.log(`❌ Không tìm thấy dữ liệu cho ${problemId} trong file JSON`);
    }
}

async function main() {
    const arg = process.argv[2];
    
    if (arg === '--batch') {
        await batchUpdate();
        process.exit(0);
    }
    
    if (arg) {
        await singleUpdate(arg);
        process.exit(0);
    }

    // Interactive mode
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('='.repeat(50));
    console.log('📝 Script cập nhật defaultCode & driverCodes');
    console.log('='.repeat(50));
    console.log('Dùng --batch để cập nhật tất cả bài trong JSON');
    console.log('Nhập "exit" để thoát.\n');

    const askQuestion = () => {
        rl.question('Nhập Problem ID: ', async (answer) => {
            const input = answer.trim();

            if (input.toLowerCase() === 'exit') {
                console.log('👋 Tạm biệt!');
                rl.close();
                process.exit(0);
            }

            if (!input) {
                console.log('⚠️ Vui lòng nhập ID hợp lệ.\n');
                askQuestion();
                return;
            }

            await singleUpdate(input);
            console.log('');
            askQuestion();
        });
    };

    askQuestion();
}

main();
