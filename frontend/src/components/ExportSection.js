import { motion } from "framer-motion";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ExportSection = ({ data }) => {
  const handleExportPDF = async () => {
    try {
      toast.info('Generating PDF report...');

      const response = await axios.post(`${API}/export-pdf`, {
        fairness_score: data.fairness_score,
        gender_stats: data.gender_stats,
        income_stats: data.income_stats,
        age_stats: data.age_stats,
        education_stats: data.education_stats,
        bias_alerts: data.bias_alerts,
        insights: data.insights
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faircheck-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF report downloaded!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.info('Generating CSV export...');

      const response = await axios.post(`${API}/export-csv`, {
        fairness_score: data.fairness_score,
        gender_stats: data.gender_stats,
        income_stats: data.income_stats,
        age_stats: data.age_stats,
        education_stats: data.education_stats,
        bias_alerts: data.bias_alerts,
        insights: data.insights
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faircheck-analysis-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('CSV export downloaded!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="glass-card p-8 mb-12"
    >
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-8 h-8 text-[#00F5FF]" />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Export Report
        </h2>
      </div>

      <p className="text-base leading-relaxed text-slate-300 mb-8">
        Download your bias analysis report to share with your team or include in documentation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          data-testid="export-pdf-btn"
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-3 glass-card p-6 hover:-translate-y-1 hover:border-[#FF4D6D]/50 transition-all duration-300 cursor-pointer group"
        >
          <FileText className="w-8 h-8 text-[#FF4D6D] group-hover:scale-110 transition-transform duration-300" />
          <div className="text-left">
            <p className="text-white font-semibold text-lg">Export as PDF</p>
            <p className="text-sm text-slate-400">Professional formatted report</p>
          </div>
        </button>

        <button
          data-testid="export-csv-btn"
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-3 glass-card p-6 hover:-translate-y-1 hover:border-[#00F5FF]/50 transition-all duration-300 cursor-pointer group"
        >
          <FileSpreadsheet className="w-8 h-8 text-[#00F5FF] group-hover:scale-110 transition-transform duration-300" />
          <div className="text-left">
            <p className="text-white font-semibold text-lg">Export as CSV</p>
            <p className="text-sm text-slate-400">Spreadsheet-ready data</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default ExportSection;
