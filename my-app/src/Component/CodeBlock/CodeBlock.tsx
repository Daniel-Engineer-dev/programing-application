import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Chọn theme "vscDarkPlus" (giống VS Code) hoặc "oneDark"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockProps = {
  code: string;
  language?: string;
};

export const CodeBlock = ({
  code,
  language = "javascript",
}: CodeBlockProps) => {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 my-4 shadow-2xl">
      <div className="bg-slate-900 px-4 py-1.5 flex justify-between items-center border-b border-slate-800">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {language}
        </span>
        {/* Bạn có thể thêm nút "Copy" ở đây sau này */}
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1.5rem",
          fontSize: "0.8rem",
          backgroundColor: "#020617", // Khớp với bg-slate-950 của bạn
        }}
        showLineNumbers={true}
        lineNumberStyle={{
          minWidth: "2.5em",
          paddingRight: "1em",
          color: "#475569",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
