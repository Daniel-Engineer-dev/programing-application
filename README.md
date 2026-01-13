# CodePro 🚀

> **Nền tảng học lập trình trực tuyến** - Thực hành, học hỏi, chinh phục!

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.5.0-orange?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.16-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 Giới thiệu

**CodePro** là một nền tảng học lập trình hiện đại, cung cấp môi trường thực hành tương tự LeetCode với nhiều tính năng mở rộng như:
- Giải bài tập lập trình đa ngôn ngữ
- Lộ trình học tập có cấu trúc
- Cuộc thi lập trình
- Diễn đàn thảo luận
- Trợ lý AI tích hợp

---

## ✨ Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 📝 **Problems** | Hệ thống bài tập lập trình với nhiều độ khó |
| 📚 **Explore** | Chủ đề, lộ trình học tập, hướng dẫn từ cộng đồng |
| 🏆 **Contests** | Cuộc thi lập trình trực tuyến |
| 💬 **Discuss** | Diễn đàn thảo luận và hỏi đáp |
| 🛒 **Shop** | Cửa hàng sản phẩm |
| 🤖 **AI Assistant** | Trợ lý AI (Gemini 2.5) hỗ trợ học tập |
| 👤 **Profile** | Quản lý hồ sơ và theo dõi tiến độ |
| 🔐 **Auth** | Đăng nhập đa nền tảng (Email, Google, GitHub) |

---

## 🛠️ Công nghệ sử dụng

### Frontend
- **Next.js 16** - React framework với App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **Framer Motion** - Animation library

### Backend & Database
- **Firebase Authentication** - Xác thực người dùng
- **Cloud Firestore** - NoSQL database
- **Firebase Storage** - Lưu trữ media

### AI Integration
- **Google Gemini 2.5 Flash** - Chatbot AI với streaming

---

## 📁 Cấu trúc dự án

```
my-app/
├── app/                    # Next.js App Router
│   ├── (user)/            # User-facing routes
│   │   └── routes/        # auth, explore, problems, contests...
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── src/
│   ├── Component/         # React components
│   ├── api/firebase/      # Firebase configuration
│   ├── hooks/             # Custom hooks
│   └── userHook/context/  # Context providers
└── public/                # Static assets
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn
- Firebase project

### Bước 1: Clone repository
```bash
git clone https://github.com/Daniel-Engineer-dev/ProgramingApp.git
cd ProgramingApp/my-app
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình environment
Tạo file `.env` trong thư mục `my-app`:
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### Bước 4: Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

---

## 📜 Scripts

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Chạy development server |
| `npm run build` | Build production |
| `npm run start` | Chạy production server |
| `npm run lint` | Kiểm tra linting |

---

## 👥 Nhóm phát triển

| Thành viên | Branch |
|------------|--------|
| DungDuong | `DungDuong` |
| ManhHa | `ManhHa` |
| TriDuc | `TriDuc` |

---

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

<p align="center">
  Made with ❤️ by <strong>CodePro Team</strong>
</p>