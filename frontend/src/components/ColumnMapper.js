import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle } from "lucide-react";

const STANDARD_COLS = [
  { key: "Hired", label: "Hired (Required)", required: true, description: "0 or 1 outcome column" },
  { key: "Gender", label: "Gender", required: false, description: "e.g. Male, Female" },
  { key: "Income", label: "Income", required: false, description: "Numeric salary/income" },
  { key: "Age", label: "Age", required: false, description: "Numeric age value" },
  { key: "Education", label: "Education", required: false, description: "e.g. Bachelor, Master, PhD" },
];

const ColumnMapper = ({ columns, suggestedMapping, onSubmit, onCancel }) => {
  const [mapping, setMapping] = useState(suggestedMapping || {});

  const handleChange = (standardCol, userCol) => {
    setMapping(prev => ({
      ...prev,
      [standardCol]: userCol || undefined
    }));
  };

  const isValid = mapping.Hired && mapping.Hired !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 max-w-3xl mx-auto"
    >
      <h3 className="text-xl font-semibold text-white mb-2">Map Your Columns</h3>
      <p className="text-sm text-slate-400 mb-6">
        Your CSV columns don't match the expected names. Map them below so we can analyze your data.
      </p>

      <div className="space-y-4">
        {STANDARD_COLS.map((std) => {
          const isMapped = mapping[std.key] && mapping[std.key] !== "";
          return (
            <div key={std.key} className="flex items-center gap-4">
              <div className="w-40 flex-shrink-0">
                <p className="text-sm text-white font-medium flex items-center gap-1.5">
                  {std.label}
                  {std.required && <span className="text-[#FF4D6D] text-xs">*</span>}
                </p>
                <p className="text-xs text-slate-500">{std.description}</p>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />

              <div className="flex-1 relative">
                <select
                  data-testid={`column-map-${std.key.toLowerCase()}`}
                  value={mapping[std.key] || ""}
                  onChange={(e) => handleChange(std.key, e.target.value)}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-lg px-4 py-3 text-white text-sm appearance-none cursor-pointer focus:border-[#00F5FF] focus:outline-none transition-colors"
                >
                  <option value="">-- Skip --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                {isMapped && (
                  <Check className="absolute right-3 top-3.5 w-4 h-4 text-[#00F5FF]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isValid && (
        <div className="flex items-center gap-2 mt-4 text-[#FF4D6D] text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>You must map at least the "Hired" column to proceed</span>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button
          data-testid="column-map-submit-btn"
          onClick={() => onSubmit(mapping)}
          disabled={!isValid}
          className={`btn-primary py-3 px-8 text-sm ${!isValid ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          Analyze with Mapping
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary py-3 px-8 text-sm"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

export default ColumnMapper;
