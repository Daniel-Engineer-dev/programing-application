/**
 * Script để đẩy danh sách sản phẩm lên Firebase Firestore
 * Chạy: node scripts/pushProducts.js
 */

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");

// Lấy config từ .env.local (cần dotenv)
require("dotenv").config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Danh sách sản phẩm
const products = [
  {
    id: "kbd",
    name: "Bàn phím Codepro",
    price: 1299000,
    image: "/products/keyboard.jpg",
    spec: {
      brand: "Codepro",
      material: "Nhựa ABS + keycap PBT",
      size: "438 x 135 x 40 mm",
      function: "Gõ code, LED, chống ghosting",
      color: "Đen",
      warranty: "12 tháng",
      details: "Bàn phím gọn, phù hợp setup học tập/làm việc.",
    },
  },
  {
    id: "mouse",
    name: "Chuột không dây Codepro",
    price: 899000,
    image: "/products/mouse.jpg",
    spec: {
      brand: "Codepro",
      material: "Nhựa ABS cao cấp",
      size: "120 x 65 x 40 mm",
      function: "Wireless 2.4G, DPI tùy chỉnh",
      color: "Đen",
      warranty: "12 tháng",
      details: "Chuột nhẹ tay, phù hợp học tập/coding.",
    },
  },
  {
    id: "mousepad",
    name: "Lót chuột Codepro",
    price: 159000,
    image: "/products/mousepad.jpg",
    spec: {
      brand: "Codepro",
      material: "Vải polyester + đế cao su",
      size: "300x800mm",
      function: "Chống trượt, dễ cuộn, dễ vệ sinh",
      color: "Đen",
      warranty: "3 tháng",
      details: "Bề mặt mịn, tracking tốt, chống trượt.",
    },
  },
  {
    id: "backpack",
    name: "Ba lô Codepro",
    price: 549000,
    image: "/products/backpack.jpg",
    spec: {
      brand: "Codepro",
      material: "Polyester 600D chống nước",
      size: "15.6 inch",
      function: "Ngăn laptop chống sốc, nhiều ngăn phụ",
      color: "Đen",
      warranty: "6 tháng",
      details: "Ba lô tối giản, đựng laptop chắc chắn.",
    },
  },
  {
    id: "cap",
    name: "Nón Codepro",
    price: 199000,
    image: "/products/cap.jpg",
    spec: {
      brand: "Codepro",
      material: "Cotton",
      size: "Free size",
      function: "Che nắng, thời trang",
      color: "Đen",
      warranty: "Không áp dụng",
      details: "Logo thêu, dễ phối đồ, thoáng khí.",
    },
  },
  {
    id: "tee",
    name: "Áo thun Codepro",
    price: 299000,
    image: "/products/tshirt.jpg",
    spec: {
      brand: "Codepro",
      material: "Cotton 100%",
      size: "S/M/L/XL",
      function: "Thời trang, thấm hút mồ hôi tốt",
      color: "Đen",
      warranty: "Đổi size trong vòng 7 ngày",
      details: "Vải dày, in bền màu, mặc thoải mái.",
    },
  },
  {
    id: "note",
    name: "Sổ ghi chú Codepro",
    price: 149000,
    image: "/products/notebook.jpg",
    spec: {
      brand: "Codepro",
      material: "Giấy 100gsm",
      size: "A5",
      function: "Ghi chú học tập",
      color: "Đen",
      warranty: "Không áp dụng",
      details: "Thiết kế gọn, phù hợp ghi chú học tập.",
    },
  },
  {
    id: "badge",
    name: "Huy hiệu Codepro",
    price: 69000,
    image: "/products/badge.jpg",
    spec: {
      brand: "Codepro",
      material: "Nhựa",
      size: "Tròn: Ø25mm, Ø32mm, Ø50mm",
      function: "Trang trí",
      color: "Trắng",
      warranty: "Không áp dụng",
      details: "Gắn balo/laptop sleeve, nhỏ gọn, chắc chắn.",
    },
  },
];

async function pushProducts() {
  console.log("Đang đẩy sản phẩm lên Firebase...");
  
  for (const product of products) {
    await setDoc(doc(db, "products", product.id), product);
    console.log(`✓ Đã thêm: ${product.name}`);
  }
  
  console.log("\n✅ Hoàn tất! Đã đẩy", products.length, "sản phẩm lên Firestore.");
}

pushProducts().catch(console.error);
