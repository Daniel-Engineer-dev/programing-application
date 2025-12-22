"use client";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { CodeBlock } from "../CodeBlock/CodeBlock";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { addDoc, serverTimestamp } from "firebase/firestore";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

type Example = {
  input: string;
  output: string;
  explanation?: string; // Bổ sung optional explanation nếu có
};
type Approach = {
  name: string;
  description: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
};

type Editorial = {
  content?: string;
  lastUpdated?: string; // Kiểu Timestamp của Firebase
  videoUrl?: string;
  approaches: Approach[];
};
type ProblemDetailsProps = {
  title: string;
  problemId: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
  tags: string[];
  editorial?: Editorial;
  onRestoreCode: (code: string, language: string) => void;
};

type TabType = "description" | "editorial" | "solution" | "submissions";
const formatEditorialDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
// Hàm bổ trợ để đọc file
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export default function ProblemDetails({
  title,
  problemId,
  difficulty,
  description,
  examples,
  constraints,
  tags,
  editorial,
  onRestoreCode,
}: ProblemDetailsProps) {
  const [tab, setTab] = useState<TabType>("description");
  // State giả lập cho like/comment
  const [starred, setStarred] = useState(false);
  const [stats, setStats] = useState({
    likes: 0,
    dislikes: 0,
    stars: 0,
    comments: 0,
  });
  const [userInteractions, setUserInteractions] = useState({
    liked: false,
    disliked: false,
    starred: false,
  });
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái mở Form đăng bài
  // State lưu bài giải đang được chọn để xem chi tiết
  const [selectedSolution, setSelectedSolution] = useState<any | null>(null);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  // Helper để style nút tab
  const getTabClass = (activeTab: TabType) => {
    return `px-4 py-2 hover:bg-slate-800 transition-colors hover:rounded-2xl hover:font-bold hover:cursor-pointer ${
      tab === activeTab
        ? "border-b-2 border-blue-600 text-white font-medium"
        : "text-gray-400 hover:text-white"
    }`;
  };
  const { user, username } = useAuthContext();
  const router = useRouter();
  // 2. Hàm xử lý Like
  const handleLike = async () => {
    if (!user) return alert("Vui lòng đăng nhập!");
    const problemRef = doc(db, "problems", problemId);

    if (userInteractions.liked) {
      await updateDoc(problemRef, { likes: arrayRemove(user.uid) });
    } else {
      // Nếu đang dislike mà bấm like thì xóa dislike đi
      await updateDoc(problemRef, {
        likes: arrayUnion(user.uid),
        dislikes: arrayRemove(user.uid),
      });
    }
  };

  // 3. Hàm xử lý Star (Lưu vào danh sách yêu thích)
  const handleStar = async () => {
    if (!user) return alert("Vui lòng đăng nhập!");
    const problemRef = doc(db, "problems", problemId);
    await updateDoc(problemRef, {
      stars: userInteractions.starred
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid),
    });
  };
  //4. Hàm xử lý nút share bài tập
  const handleShare = (
    platform: "facebook" | "messenger" | "twitter" | "linkedin" | "copy"
  ) => {
    const url = window.location.href;
    const titleText = `Giải bài toán này cùng mình nhé: ${title}`;

    const configs = {
      // Chia sẻ lên Timeline Facebook
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,

      // Gửi tin nhắn trực tiếp qua Messenger (Yêu cầu App ID nếu dùng SDK, hoặc dùng link chuyển hướng)
      messenger: `fb-messenger://share/?link=${encodeURIComponent(url)}`,

      // Twitter (X)
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(titleText)}`,

      // LinkedIn
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      alert("Đã sao chép liên kết bài toán!");
      return;
    }

    // Đối với Messenger trên PC, fb-messenger:// không hoạt động, cần dùng link facebook
    if (platform === "messenger") {
      // Cách phổ biến nhất không cần App ID: Dùng link chuyển hướng của FB
      const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
        url
      )}&app_id=123456789&redirect_uri=${encodeURIComponent(url)}`;
      // Lưu ý: app_id là bắt buộc của FB để dùng Dialog này. Bạn có thể tạo 1 App ID nhanh trên Meta for Developers.
      window.open(messengerUrl, "_blank", "width=600,height=500");
    } else {
      window.open(configs[platform], "_blank", "width=600,height=500");
    }
  };
  //5. Hàm xử lý nút comment
  const handleCommentClick = () => {
    // 1. Chuyển sang tab Giải pháp (hoặc tab Discussion nếu bạn có)
    setTab("solution");

    // 2. Nếu muốn tự động mở Modal đăng bài giải/thảo luận
    // setIsModalOpen(true);

    // 3. Cuộn đến phần đầu của nội dung
    const contentArea = document.querySelector(".overflow-y-auto");
    if (contentArea) contentArea.scrollTop = 0;
  };
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    issues: [] as string[],
    additional: "",
  });
  const handleFeedbackSubmit = async () => {
    if (feedbackData.issues.length === 0 && !feedbackData.additional) {
      return alert("Vui lòng chọn ít nhất một vấn đề hoặc nhập ý kiến!");
    }

    try {
      // Lưu vào sub-collection của bài toán hiện tại
      const feedbackRef = collection(db, "problems", problemId, "feedbacks");

      await addDoc(feedbackRef, {
        userId: user?.uid || "anonymous",
        userName: username || "Guest",
        issues: feedbackData.issues,
        additionalFeedback: feedbackData.additional,
        createdAt: serverTimestamp(),
      });

      alert("Cảm ơn phản hồi của bạn!");
      setIsFeedbackOpen(false);
      setFeedbackData({ issues: [], additional: "" }); // Reset form
    } catch (error) {
      console.error("Lỗi khi gửi feedback:", error);
      alert("Không thể gửi phản hồi lúc này.");
    }
  };
  //  Hàm xử lý Dislike
  const handleDislike = async () => {
    if (!user) return alert("Vui lòng đăng nhập để thực hiện tính năng này!");
    const problemRef = doc(db, "problems", problemId);

    try {
      if (userInteractions.disliked) {
        // Nếu đã dislike rồi -> Nhấn lại để hủy dislike
        await updateDoc(problemRef, {
          dislikes: arrayRemove(user.uid),
        });
      } else {
        // Nếu chưa dislike -> Thêm vào mảng dislikes và đồng thời XÓA khỏi mảng likes (nếu có)
        await updateDoc(problemRef, {
          dislikes: arrayUnion(user.uid),
          likes: arrayRemove(user.uid),
        });
      }
    } catch (error) {
      console.error("Lỗi khi thực hiện dislike:", error);
    }
  };
  // 1. Lấy dữ liệu thực tế từ Firebase
  useEffect(() => {
    const problemRef = doc(db, "problems", problemId);
    const unsubscribe = onSnapshot(problemRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStats({
          likes: data.likes?.length || 0,
          dislikes: data.dislikes?.length || 0,
          stars: data.stars?.length || 0,
          comments: data.commentCount || 0,
        });

        // Kiểm tra xem user hiện tại đã tương tác chưa
        if (user) {
          setUserInteractions({
            liked: data.likes?.includes(user.uid),
            disliked: data.dislikes?.includes(user.uid),
            starred: data.stars?.includes(user.uid),
          });
        }
      }
    });
    return () => unsubscribe();
  }, [problemId, user]);

  useEffect(() => {
    setSelectedSolution(null);
  }, [tab]);

  useEffect(() => {
    if (tab !== "solution") return;

    // Truy vấn collection community_solutions lọc theo problemId
    const q = query(
      collection(db, "community_solutions"),
      where("problemId", "==", problemId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Format ngày tháng nếu createdAt tồn tại
        formattedDate: doc
          .data()
          .createdAt?.toDate()
          .toLocaleDateString("vi-VN"),
      }));
      setSolutions(data);
    });

    return () => unsubscribe();
  }, [tab, problemId]);

  useEffect(() => {
    // Chỉ lấy dữ liệu khi đang ở tab Submissions và người dùng đã đăng nhập
    if (tab !== "submissions" || !user?.uid) return;

    setLoadingSub(true);

    // Tham chiếu đến sub-collection: users/{uid}/submissions
    const submissionsRef = collection(db, "users", user.uid, "submissions");

    // Tạo query: Lọc theo tên bài tập này và sắp xếp thời gian mới nhất lên đầu
    const q = query(
      submissionsRef,
      where("problemId", "==", problemId), // Hoặc problemId tùy theo biến định danh của bạn
      orderBy("timestamp", "desc")
    );

    // Lắng nghe dữ liệu thời gian thực
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMySubmissions(subs);
        setLoadingSub(false);
      },
      (error) => {
        console.error("Lỗi lấy submissions:", error);
        setLoadingSub(false);
      }
    );

    return () => unsubscribe();
  }, [tab, user?.uid, problemId]);

  // Hàm định dạng thời gian
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Đang xử lý...";
    const date = timestamp.toDate();
    return (
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " " +
      date.toLocaleDateString("vi-VN")
    );
  };
  return (
    <div className="rounded-2xl w-[45%] border flex flex-col text-white border-slate-700 mt-2 mr-1 mb-15 ml-5 h-[90vh] bg-slate-950">
      {/* Header Tabs (Sticky top) */}
      <div className="flex border-b border-slate-700 text-sm bg-slate-950 rounded-t-2xl">
        <button
          className={getTabClass("description")}
          onClick={() => setTab("description")}
        >
          Mô tả
        </button>

        <button
          className={getTabClass("editorial")}
          onClick={() => setTab("editorial")}
        >
          Biên tập
        </button>
        <button
          className={getTabClass("solution")}
          onClick={() => setTab("solution")}
        >
          Giải pháp
        </button>
        <button
          className={getTabClass("submissions")}
          onClick={() => setTab("submissions")}
        >
          Lịch sử nộp bài
        </button>
      </div>

      {/* Content Area (Scrollable) */}
      <div className="p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* --- TAB 1: MÔ TẢ (Bao gồm Đề bài + Ví dụ + Ràng buộc) --- */}
        {tab === "description" && (
          <div className="space-y-8">
            {/* 1. Header Bài Toán */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full bg-opacity-20 ${
                    difficulty === "Easy"
                      ? "text-green-500 bg-slate-700"
                      : difficulty === "Medium"
                      ? "text-yellow-500 bg-slate-700"
                      : "text-red-500 bg-slate-700"
                  }`}
                >
                  {difficulty}
                </span>
                {/* --- KHỐI TAGS BÀI TOÁN --- */}
                {tags && tags.length > 0 && (
                  <>
                    <span className="text-slate-600">|</span>{" "}
                    {/* Dấu gạch ngăn cách */}
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Nội dung HTML mô tả */}
            <div
              dangerouslySetInnerHTML={{ __html: description }}
              className="prose prose-invert max-w-none text-sm leading-relaxed"
            />

            {/* 3. Danh sách Ví dụ */}
            <div className="space-y-4">
              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border-l-4 border-slate-600 bg-slate-900 p-4 text-sm font-mono space-y-2"
                >
                  <h3 className="font-bold text-base">Ví dụ {idx + 1}:</h3>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-400">Input:</span>
                    <span className="text-slate-200">{ex.input}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-400">Output:</span>
                    <span className="text-slate-200">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-400">
                        Explanation:
                      </span>
                      <span className="text-slate-200">{ex.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 4. Ràng buộc */}
            <div className="space-y-3">
              <h3 className="font-bold text-base">Ràng buộc:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1 text-slate-300 font-mono">
                {constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* --- TAB 2: EDITORIAL (Đã sửa để render động từ Firebase) --- */}
        {tab === "editorial" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">Editorial Solution</h2>
              {/* HIỂN THỊ NGÀY CẬP NHẬT */}
              {editorial?.lastUpdated && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20v-6M9 20V10M15 20V4M3 20h18" />
                  </svg>
                  <span>
                    Cập nhật lần cuối:{" "}
                    {formatEditorialDate(editorial.lastUpdated)}
                  </span>
                </div>
              )}
              {/* Hiển thị nội dung tổng quan nếu có field content */}
              {editorial?.content && (
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  {editorial.content}
                </p>
              )}
            </div>

            {/* PHẦN VIDEO HƯỚNG DẪN (Bổ sung) */}
            {editorial?.videoUrl && (
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={editorial.videoUrl.replace("watch?v=", "embed/")} // Tự động chuyển link youtube thường sang link nhúng
                  title="Video tutorial"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            <div className="space-y-6">
              {/* Duyệt qua mảng approaches đã tạo thủ công trên Firestore */}
              {editorial?.approaches && editorial.approaches.length > 0 ? (
                editorial.approaches.map((app: any, index: number) => (
                  <div
                    key={index}
                    className="p-5 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    {/* Tên cách giải */}
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">
                      Approach {index + 1}: {app.name}
                    </h3>

                    {/* Mô tả cách giải */}
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">
                      {app.description}
                    </p>

                    {/* Hiển thị Code Snippet nếu có */}
                    {app.code && (
                      <CodeBlock
                        code={app.code}
                        language="cpp" // Hoặc lấy từ một field language trong Firebase nếu có
                      />
                    )}

                    {/* Độ phức tạp */}
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 flex flex-col min-w-[120px]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          Time Complexity
                        </span>
                        <span className="text-sm font-mono text-purple-400">
                          {app.timeComplexity || "N/A"}
                        </span>
                      </div>
                      <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 flex flex-col min-w-[120px]">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          Space Complexity
                        </span>
                        <span className="text-sm font-mono text-green-400">
                          {app.spaceComplexity || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Trường hợp chưa có dữ liệu */
                <div className="py-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Nội dung hướng dẫn đang được biên soạn...
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "solution" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* TRƯỜNG HỢP 1: ĐANG XEM CHI TIẾT BÀI GIẢI */}
            {selectedSolution ? (
              <div className="space-y-6">
                {/* Nút quay lại danh sách */}
                <button
                  onClick={() => setSelectedSolution(null)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors mb-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Quay lại danh sách
                </button>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedSolution.title}
                  </h2>

                  <div className="flex items-center gap-3 py-2 border-y border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs">
                      {selectedSolution.author?.[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {selectedSolution.author}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {selectedSolution.formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedSolution.content}
                  </div>

                  {/* Hiển thị Code của người dùng */}
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-slate-400 mb-2">
                      Mã nguồn:
                    </h4>
                    <CodeBlock
                      code={selectedSolution.code}
                      language={
                        selectedSolution.language?.toLowerCase() || "javascript"
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* TRƯỜNG HỢP 2: HIỂN THỊ DANH SÁCH (Code cũ của bạn nhưng thêm onClick) */
              <>
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h2 className="text-xl font-bold">Community Solutions</h2>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    Viết bài giải
                  </button>
                </div>

                <div className="space-y-4">
                  {solutions.map((sol) => (
                    <div
                      key={sol.id}
                      onClick={() => setSelectedSolution(sol)} // Click để xem chi tiết
                      className="group p-5 rounded-2xl border border-slate-800 bg-slate-900/20 hover:bg-slate-900/40 hover:border-blue-500/50 transition-all cursor-pointer"
                    >
                      <h3 className="font-bold text-slate-200 group-hover:text-blue-400 mb-2">
                        {sol.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                        {sol.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px]">
                            {sol.author?.[0]}
                          </div>
                          {sol.author}
                        </span>
                        <span>{sol.formattedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">
                Chia sẻ giải pháp của bạn
              </h2>

              {/* Chọn ngôn ngữ */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-medium">
                  Ngôn ngữ lập trình
                </label>
                <select
                  id="sol-language"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm outline-none focus:border-blue-500 text-slate-200"
                >
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Tiêu đề (Ví dụ: Sử dụng Hash Map tối ưu O(n))"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-all text-white"
                id="sol-title"
              />

              <textarea
                placeholder="Giải thích ngắn gọn ý tưởng của bạn..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm h-24 outline-none focus:border-blue-500 transition-all text-white"
                id="sol-content"
              />

              {/* Tải tệp lên */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-medium">
                  Tải tệp mã nguồn (Tùy chọn)
                </label>
                <input
                  type="file"
                  id="sol-file"
                  accept=".cpp,.java,.js,.py,.txt"
                  className="text-xs text-slate-500 
      /* 1. Vô hiệu hóa nhấn trên toàn bộ input */
      pointer-events-none 
      
      /* 2. Style cho nút và cấp lại quyền nhấn + pointer */
      file:pointer-events-auto 
      file:cursor-pointer
      
      file:mr-4 file:py-2 file:px-4 
      file:rounded-full file:border-0 
      file:text-xs file:font-semibold 
      file:bg-slate-800 file:text-slate-300 
      hover:file:bg-slate-700"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // 1. Đọc nội dung file
                      const content = await readFileContent(file);
                      (
                        document.getElementById(
                          "sol-code"
                        ) as HTMLTextAreaElement
                      ).value = content;

                      // 2. Tự động nhận diện ngôn ngữ dựa trên đuôi file
                      const extension = file.name
                        .split(".")
                        .pop()
                        ?.toLowerCase();
                      const langSelect = document.getElementById(
                        "sol-language"
                      ) as HTMLSelectElement;

                      if (extension === "py") langSelect.value = "python";
                      else if (extension === "cpp") langSelect.value = "cpp";
                      else if (extension === "java") langSelect.value = "java";
                      else if (extension === "js")
                        langSelect.value = "javascript";
                    }
                  }}
                />
              </div>

              <textarea
                placeholder="Hoặc dán mã nguồn của bạn vào đây..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm font-mono h-40 outline-none focus:border-blue-500 transition-all text-white"
                id="sol-code"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    const title = (
                      document.getElementById("sol-title") as HTMLInputElement
                    ).value;
                    const content = (
                      document.getElementById(
                        "sol-content"
                      ) as HTMLTextAreaElement
                    ).value;
                    const code = (
                      document.getElementById("sol-code") as HTMLTextAreaElement
                    ).value;
                    const language = (
                      document.getElementById(
                        "sol-language"
                      ) as HTMLSelectElement
                    ).value;

                    if (!title || !code)
                      return alert("Vui lòng nhập đủ tiêu đề và mã nguồn!");

                    await addDoc(collection(db, "community_solutions"), {
                      problemId,
                      title,
                      content,
                      code,
                      language, // Lưu ngôn ngữ đã chọn
                      userId: user?.uid,
                      author:
                        username || user?.displayName || "Người dùng ẩn danh",
                      userAvatar: user?.photoURL || "",
                      createdAt: serverTimestamp(),
                      upvotes: [],
                    });

                    setIsModalOpen(false);
                  }}
                  className="px-6 py-2 bg-blue-600 rounded-lg text-sm font-bold hover:bg-blue-500 transition-all text-white"
                >
                  Đăng bài
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: SUBMISSIONS (Lịch sử) --- */}
        {tab === "submissions" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold">My Submissions</h2>

            {!user ? (
              /* --- Chưa đăng nhập (Giữ nguyên code của bạn) --- */
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-xl border border-dashed border-slate-700">
                <p className="text-slate-400 mb-4">
                  Đăng nhập ngay để xem lịch sử làm bài
                </p>
                <button
                  onClick={() => router.push("/routes/auth/login")}
                  className="..."
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-800">
                  <div className="col-span-2">Status</div>
                  <div>Runtime</div>
                  <div>Memory</div>
                  <div className="text-right">Time</div>
                </div>

                {/* Submission Rows */}
                <div className="space-y-2">
                  {loadingSub ? (
                    <div className="text-center py-10 animate-pulse text-slate-500">
                      Đang tải...
                    </div>
                  ) : mySubmissions.length > 0 ? (
                    mySubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        // SỰ KIỆN NHẤN ĐỂ XEM CHI TIẾT
                        onClick={() => setSelectedSub(sub)}
                        className="grid grid-cols-5 gap-4 px-4 py-3 bg-slate-900/30 rounded-lg border border-transparent hover:border-blue-500/50 hover:bg-slate-900 transition-all items-center text-sm group cursor-pointer"
                      >
                        <div className="col-span-2 flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              sub.status === "Accepted"
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {sub.status}
                          </span>
                          <svg
                            className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                        <div className="text-slate-300">
                          {sub.runtime || "N/A"}
                        </div>
                        <div className="text-slate-300">
                          {sub.memory || "N/A"}
                        </div>
                        <div className="text-right text-slate-500 text-[10px] italic">
                          {formatTime(sub.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 italic">
                      Bạn chưa nộp bài nào.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- MODAL HIỂN THỊ CHI TIẾT BÀI NỘP --- */}
            {selectedSub && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-110 flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 w-full max-w-4xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-lg font-bold ${
                          selectedSub.status === "Accepted"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {selectedSub.status}
                      </span>
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span className="bg-slate-800 px-2 py-1 rounded">
                          Runtime: {selectedSub.runtime}
                        </span>
                        <span className="bg-slate-800 px-2 py-1 rounded">
                          Memory: {selectedSub.memory}
                        </span>
                        <span className="bg-slate-800 px-2 py-1 rounded uppercase">
                          {selectedSub.language}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSub(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {/* Modal Content (Code) */}
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
                    {/* Sử dụng Component CodeBlock (react-syntax-highlighter) đã hướng dẫn ở trên */}
                    <CodeBlock
                      code={selectedSub.code}
                      language={
                        selectedSub.language?.toLowerCase() || "javascript"
                      }
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <span className="text-xs text-slate-500 italic">
                      Đã nộp vào: {formatTime(selectedSub.timestamp)}
                    </span>
                    <button
                      onClick={() => {
                        // Gọi hàm callback từ component cha truyền xuống
                        onRestoreCode(selectedSub.code, selectedSub.language);

                        // Đóng modal và chuyển tab
                        setSelectedSub(null);
                        setTab("description");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Khôi phục mã nguồn
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* --- 5. FOOTER TOOLBAR (FIXED BOTTOM) --- */}
      {/* Chỉ hiển thị toolbar khi đang ở tab Description */}
      {tab === "description" && (
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-sm bg-slate-950 rounded-b-2xl shrink-0">
          {/* Các nút tương tác bên trái */}
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                userInteractions.liked ? "text-blue-500" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
              <span className="font-medium">{stats.likes}</span>
            </button>

            {/* Dislike Button */}
            <button
              onClick={handleDislike}
              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                userInteractions.disliked ? "text-red-500" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={userInteractions.disliked ? "currentColor" : "none"} // Đổ màu nếu đã nhấn
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 14V2" />
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
              {/* Hiển thị số lượng dislike thực tế */}
              <span className="font-medium">{stats.dislikes}</span>
            </button>

            {/* Comment Button */}
            <button
              className="flex items-center gap-1.5 transition-colors hover:text-white"
              onClick={handleCommentClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-medium">
                {/* Đếm tổng số lượng community solutions hiện có làm chỉ số thảo luận */}
                {solutions.length}
              </span>
            </button>

            {/* Star Button */}
            <button
              onClick={handleStar}
              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                userInteractions.starred ? "text-yellow-500" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={starred ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            {/* Share Button */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)} // Thêm state quản lý đóng mở
                className="flex items-center gap-1.5 transition-colors hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" x2="12" y1="2" y2="15" />
                </svg>
              </button>

              {showShareMenu && (
                <>
                  {/* Overlay để click ra ngoài thì đóng menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                  ></div>

                  <div className="absolute bottom-full left-0 mb-3 z-50 flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden min-w-[180px] animate-in slide-in-from-bottom-2">
                    <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/50">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Gửi đến bạn bè
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleShare("messenger");
                        setShowShareMenu(false);
                      }}
                      className="px-4 py-2.5 text-xs hover:bg-blue-600/20 hover:text-blue-400 flex items-center gap-3 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Messenger
                    </button>

                    <button
                      onClick={() => {
                        handleShare("facebook");
                        setShowShareMenu(false);
                      }}
                      className="px-4 py-2.5 text-xs hover:bg-slate-800 flex items-center gap-3 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                      Facebook (Tin)
                    </button>

                    <button
                      onClick={() => {
                        handleShare("twitter");
                        setShowShareMenu(false);
                      }}
                      className="px-4 py-2.5 text-xs hover:bg-slate-800 flex items-center gap-3 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      Twitter (X)
                    </button>

                    <div className="p-2 border-t border-slate-800 bg-slate-950/30">
                      <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                        <input
                          readOnly
                          value={window.location.href}
                          className="bg-transparent text-[10px] text-slate-400 outline-none w-full truncate"
                        />
                        <button
                          onClick={() => handleShare("copy")}
                          className="text-[10px] text-blue-400 font-bold whitespace-nowrap px-1"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </button>
          </div>
          {/* --- FEEDBACK MODAL --- */}
          {isFeedbackOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-150 flex items-center justify-center p-4">
              <div className="bg-[#282828] border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                  <h2 className="text-lg font-bold text-white">Feedback</h2>
                  <button
                    onClick={() => setIsFeedbackOpen(false)}
                    className="text-slate-400 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Problem:
                    </label>
                    <p className="text-white font-medium mt-1">{title}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs text-red-400">
                      * Issues Encountered:
                    </label>

                    {[
                      "Description or examples are unclear or incorrect",
                      "Difficulty is inaccurate",
                      "Testcases are missing or incorrect",
                      "Runtime is too strict",
                      "Edge cases are too frustrating to solve",
                      "Other",
                    ].map((issue) => (
                      <label
                        key={issue}
                        className="flex items-center gap-3 group cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 checked:bg-green-500 transition-all cursor-pointer"
                          checked={feedbackData.issues.includes(issue)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFeedbackData({
                                ...feedbackData,
                                issues: [...feedbackData.issues, issue],
                              });
                            } else {
                              setFeedbackData({
                                ...feedbackData,
                                issues: feedbackData.issues.filter(
                                  (i) => i !== issue
                                ),
                              });
                            }
                          }}
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          {issue}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">
                      Additional Feedback:
                    </label>
                    <textarea
                      value={feedbackData.additional}
                      onChange={(e) =>
                        setFeedbackData({
                          ...feedbackData,
                          additional: e.target.value,
                        })
                      }
                      className="w-full bg-[#333333] border border-slate-700 rounded-lg p-3 text-sm text-white h-24 outline-none focus:border-green-500 transition-all resize-none"
                      placeholder="Nhập thêm ý kiến của bạn..."
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center p-4 bg-[#1e1e1e] border-t border-slate-700">
                  <span className="text-[10px] text-slate-500">
                    You may also{" "}
                    <a href="#" className="text-blue-400 hover:underline">
                      submit via Github
                    </a>
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsFeedbackOpen(false)}
                      className="px-5 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFeedbackSubmit}
                      className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg shadow-lg transition-all"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái Online bên phải */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-xs">
              14 Online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
