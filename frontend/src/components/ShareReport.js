import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const ShareReport = ({ analysisId }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/report/${analysisId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpen = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="glass-card p-8 mb-12"
    >
      <div className="flex items-center gap-3 mb-4">
        <Share2 className="w-8 h-8 text-[#7B61FF]" />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Share Report
        </h2>
      </div>

      <p className="text-base leading-relaxed text-slate-300 mb-6">
        Share this analysis with hackathon judges, team members, or stakeholders. They can view the full report without re-running the analysis.
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-[#1E293B] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 truncate">
          {shareUrl}
        </div>
        <button
          data-testid="copy-share-link-btn"
          onClick={handleCopy}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
            copied
              ? 'bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/40'
              : 'bg-[#7B61FF] text-white hover:bg-[#7B61FF]/80 hover:shadow-[0_0_20px_rgba(123,97,255,0.3)]'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          data-testid="open-share-link-btn"
          onClick={handleOpen}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm border border-white/10 text-slate-300 hover:text-[#00F5FF] hover:border-[#00F5FF]/40 transition-all duration-300"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </button>
      </div>
    </motion.div>
  );
};

export default ShareReport;
