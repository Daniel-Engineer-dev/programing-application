// Seed dữ liệu "Giải pháp cộng đồng" (community_solutions) cho 30 bài tập đầu tiên
// (id 100-129, sắp xếp theo trường 'id') + bơm thêm likes/dislikes/stars cho chính các bài đó
// để trang bài tập trông sôi nổi hơn.
//
// Chạy thử trước (không ghi gì): node scripts/seedCommunitySolutions.js --dry
// Chạy thật:                     node scripts/seedCommunitySolutions.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const { SOLUTIONS } = require("./solutionsData.js");

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const DRY_RUN = process.argv.includes("--dry");

// --- Bút danh giả (dùng chung, lặp lại giữa các bài để mô phỏng cộng đồng thật) ---
const AUTHORS = [
  "trantuananh_dev", "lethimai03", "nguyenvanhung", "phamthilananh",
  "hoangducminh", "vuthiquynh", "dangkhoa_cs", "buithihuong",
  "dinhcongson", "ngoquynhtrang", "lyhoangnam", "truongthanhtung",
  "phanthiyen", "vothanhdat", "caoxuanbach", "domaianh",
  "nguyenhoangphuc", "tranthingocmai", "lequangvinh", "hokimngan",
];

// Đoạn mở đầu ngẫu nhiên để nội dung không bị lặp y hệt khi tái sử dụng cùng 1 code mẫu
const INTROS = [
  "Chia sẻ lời giải của mình, mọi người góp ý thêm nhé!",
  "Mình vừa AC bài này, xin phép chia sẻ cách làm:",
  "Sau khi thử vài cách thì đây là hướng đi mình thấy ổn nhất:",
  "Đây là cách tiếp cận mình dùng, code khá ngắn gọn:",
  "Mình trình bày ý tưởng như bên dưới, có gì sai sót mong mọi người chỉ giáo:",
  "Bài này khá hay, mình xin đóng góp lời giải:",
  "Cách làm của mình, đã test qua các test case:",
  "",
];

// Hậu tố ngẫu nhiên gắn vào tiêu đề để tránh trùng lặp 100% khi cùng 1 variant được đăng nhiều lần
const TITLE_SUFFIXES = [
  "", "", "", // để trống nhiều hơn, tránh lạm dụng hậu tố
  " - đã test kỹ",
  " (dễ hiểu cho người mới)",
  " | AC 100%",
  " - giải thích chi tiết",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// Timestamp ngẫu nhiên trong khoảng 1-90 ngày trước, để danh sách trông có hoạt động dần theo thời gian
function randomPastTimestamp() {
  const daysAgo = randInt(1, 90);
  const ms = Date.now() - daysAgo * 24 * 60 * 60 * 1000 - randInt(0, 86400000);
  return admin.firestore.Timestamp.fromMillis(ms);
}

function buildSolutionDocs(problemDocId, variants) {
  const count = randInt(4, 7);
  const docs = [];
  for (let i = 0; i < count; i++) {
    // Ưu tiên variant đầu tiên (thường là cách tối ưu/chuẩn) nhiều hơn nếu có 2 variant
    const variant =
      variants.length > 1 && Math.random() > 0.6 ? variants[1] : variants[0];

    const intro = pick(INTROS);
    const content = intro ? `${intro}\n\n${variant.content}` : variant.content;
    const title = `${variant.title}${pick(TITLE_SUFFIXES)}`;
    const author = pick(AUTHORS);

    docs.push({
      problemId: problemDocId,
      title,
      content,
      code: variant.code,
      language: "cpp",
      userId: `seed_${author}`,
      author,
      userAvatar: "",
      createdAt: randomPastTimestamp(),
      upvotes: pickN(
        AUTHORS.map((a) => `seed_${a}`),
        randInt(0, 8)
      ),
    });
  }
  return docs;
}

function fakeUidPool(prefix, count) {
  return Array.from({ length: count }, (_, i) => `${prefix}_${i}_${Math.random().toString(36).slice(2, 8)}`);
}

(async () => {
  const snap = await db.collection("problems").orderBy("id").limit(30).get();
  console.log(`Đọc được ${snap.size} bài tập (id 100-129 dự kiến).`);
  console.log(DRY_RUN ? "\n--- DRY RUN (không ghi) ---\n" : "\n--- ĐANG SEED ---\n");

  let batch = db.batch();
  let opCount = 0;
  let totalSolutions = 0;
  let totalProblemsUpdated = 0;

  const commitIfNeeded = async (force = false) => {
    if (opCount >= 400 || force) {
      if (!DRY_RUN && opCount > 0) await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  };

  for (const doc of snap.docs) {
    const problemDocId = doc.id;
    const variants = SOLUTIONS[problemDocId];

    if (!variants) {
      console.log(`⚠️  Bỏ qua ${problemDocId} — chưa có dữ liệu lời giải mẫu.`);
      continue;
    }

    // 1. Seed community_solutions
    const solutionDocs = buildSolutionDocs(problemDocId, variants);
    console.log(`${problemDocId}: +${solutionDocs.length} giải pháp`);
    for (const sol of solutionDocs) {
      const ref = db.collection("community_solutions").doc();
      if (!DRY_RUN) batch.set(ref, sol);
      opCount++;
      totalSolutions++;
      await commitIfNeeded();
    }

    // 2. Bơm likes/dislikes/stars cho chính bài toán
    const likes = fakeUidPool("like", randInt(8, 45));
    const dislikes = fakeUidPool("dislike", randInt(0, 6));
    const stars = fakeUidPool("star", randInt(3, 25));
    if (!DRY_RUN) {
      batch.update(doc.ref, { likes, dislikes, stars });
    }
    opCount++;
    totalProblemsUpdated++;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);

  console.log("\n" + "=".repeat(50));
  console.log(`🎉 Hoàn thành${DRY_RUN ? " (dry run)" : ""}!`);
  console.log(`📦 Tổng số giải pháp cộng đồng đã tạo: ${totalSolutions}`);
  console.log(`👍 Tổng số bài toán được cập nhật likes/dislikes/stars: ${totalProblemsUpdated}`);
  console.log("=".repeat(50));
  process.exit(0);
})().catch((e) => {
  console.error("❌ LỖI:", e.code || e.message);
  process.exit(1);
});
