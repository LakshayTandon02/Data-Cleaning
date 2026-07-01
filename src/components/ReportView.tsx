import React from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Settings } from "lucide-react";

interface ReportViewProps {
  reportMarkdown: string;
}

/**
 * Super-polished, robust visual parsing of Gemini's Senior Data Science Markdown Report.
 * Renders in styled responsive blocks with customized indicators and alerts.
 */
export const ReportView: React.FC<ReportViewProps> = ({ reportMarkdown }) => {
  if (!reportMarkdown) {
    return (
      <div className="p-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
        <p className="text-slate-400 font-sans">No report available. Upload a dataset to begin AI analysis.</p>
      </div>
    );
  }

  // Parse markdown text programmatically into stylized section segments
  const lines = reportMarkdown.split("\n");
  const sections: { title: string; category: string; content: string[] }[] = [];
  let currentSection: { title: string; category: string; content: string[] } | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    // Detect standard section headers like "📊 DATA CLEANING REPORT", "1. Dataset Overview", "2. Issues Detected"
    const headerMatch = trimmed.match(/^(?:\d+\.\s*|📊\s*|📁\s*)([A-Za-z0-9\s&]+)/i) || trimmed.startsWith("###") || trimmed.startsWith("##");
    
    if (headerMatch && (trimmed.toLowerCase().includes("overview") || trimmed.toLowerCase().includes("issues") || trimmed.toLowerCase().includes("actions") || trimmed.toLowerCase().includes("encoding") || trimmed.toLowerCase().includes("feature") || trimmed.toLowerCase().includes("report"))) {
      let title = typeof headerMatch === "object" ? headerMatch[1]?.trim() : trimmed.replace(/^[#\s]+/, "");
      
      let category = "general";
      if (title.toLowerCase().includes("overview")) category = "overview";
      else if (title.toLowerCase().includes("issues")) category = "issues";
      else if (title.toLowerCase().includes("actions")) category = "actions";
      else if (title.toLowerCase().includes("encoding")) category = "encoding";
      else if (title.toLowerCase().includes("feature")) category = "features";

      currentSection = {
        title: title || trimmed,
        category,
        content: [],
      };
      sections.push(currentSection);
    } else {
      if (!currentSection) {
        currentSection = {
          title: "Executive Analytical Summary",
          category: "overview",
          content: [],
        };
        sections.push(currentSection);
      }
      currentSection.content.push(line);
    }
  });

  // Helper to convert inline markdown code (e.g. `col_name` to monospace code tag and **bold** to bold tag)
  const renderFormattedText = (text: string) => {
    if (!text.trim()) return <br />;
    
    // Split bold text markers `**bold**`
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      const precedingText = text.substring(currentIdx, match.index);
      if (precedingText) {
        parts.push(...renderInlineCode(precedingText));
      }
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-white">
          {match[1]}
        </strong>
      );
      currentIdx = boldRegex.lastIndex;
    }
    
    if (currentIdx < text.length) {
      parts.push(...renderInlineCode(text.substring(currentIdx)));
    }
    
    return parts;
  };

  const renderInlineCode = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    const codeRegex = /`([^`]+)`/g;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      const precedingText = text.substring(currentIdx, match.index);
      if (precedingText) {
        parts.push(precedingText);
      }
      parts.push(
        <code key={`code-${match.index}`} className="px-1.5 py-0.5 bg-black/40 text-rose-300 font-mono text-xs rounded border border-white/10">
          {match[1]}
        </code>
      );
      currentIdx = codeRegex.lastIndex;
    }

    if (currentIdx < text.length) {
      parts.push(text.substring(currentIdx));
    }

    return parts;
  };

  const getSectionIcon = (category: string) => {
    switch (category) {
      case "overview":
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      case "issues":
        return <AlertTriangle className="w-5 h-5 text-amber-450 text-amber-400" />;
      case "actions":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "encoding":
        return <Settings className="w-5 h-5 text-cyan-400" />;
      case "features":
        return <Lightbulb className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getSectionStyles = (category: string) => {
    switch (category) {
      case "overview":
        return "border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md";
      case "issues":
        return "border-amber-500/20 bg-amber-500/5 backdrop-blur-md";
      case "actions":
        return "border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md";
      case "encoding":
        return "border-cyan-500/20 bg-cyan-500/5 backdrop-blur-md";
      case "features":
        return "border-purple-500/20 bg-purple-500/5 backdrop-blur-md";
      default:
        return "border-white/10 bg-white/5 backdrop-blur-md";
    }
  };

  return (
    <div className="space-y-6">
      {sections.map((sect, sectIdx) => {
        // Skip empty content
        const cleanContent = sect.content.filter(c => c.trim().length > 0);
        if (cleanContent.length === 0 && sect.title.toLowerCase().includes("report")) return null;

        return (
          <div
            id={`report-sect-${sectIdx}`}
            key={`sect-${sectIdx}`}
            className={`p-6 border rounded-xl shadow-2xl transition-all duration-300 hover:border-white/20 hover:scale-[1.01] ${getSectionStyles(sect.category)}`}
          >
            <div className="flex items-center gap-3 pb-3 mb-4 border-b border-white/10">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                {getSectionIcon(sect.category)}
              </div>
              <h3 className="font-sans font-semibold text-lg text-white tracking-tight">
                {sect.title}
              </h3>
            </div>

            <div className="space-y-2.5 font-sans text-sm text-slate-300 leading-relaxed">
              {sect.content.map((line, lineIdx) => {
                const trimmed = line.trim();

                // Bullet points
                if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                  const bulletText = trimmed.replace(/^[\*\-]\s*/, "");
                  return (
                    <div key={lineIdx} className="flex gap-2.5 pl-2 py-0.5">
                      <span className="text-indigo-400 select-none">•</span>
                      <span className="flex-1 text-slate-300">{renderFormattedText(bulletText)}</span>
                    </div>
                  );
                }

                // Numbered list
                const numMatch = trimmed.match(/^\d+\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lineIdx} className="flex gap-2.5 pl-2 py-0.5 font-sans">
                      <span className="text-indigo-300 font-semibold select-none">{trimmed.split(".")[0]}.</span>
                      <span className="flex-1 text-slate-300">{renderFormattedText(numMatch[1])}</span>
                    </div>
                  );
                }

                // Subheaders
                if (trimmed.startsWith("###")) {
                  return (
                    <h5 key={lineIdx} className="text-white font-semibold mt-4 mb-2 font-sans tracking-tight">
                      {renderFormattedText(trimmed.replace(/^###\s*/, ""))}
                    </h5>
                  );
                }
                if (trimmed.startsWith("##")) {
                  return (
                    <h4 key={lineIdx} className="text-white font-bold mt-4 mb-2 font-sans tracking-tight text-base">
                      {renderFormattedText(trimmed.replace(/^##\s*/, ""))}
                    </h4>
                  );
                }

                return (
                  <p key={lineIdx} className="font-sans text-slate-300">
                    {renderFormattedText(line)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
