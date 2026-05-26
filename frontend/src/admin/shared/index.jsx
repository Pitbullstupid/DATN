import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

export const Spinner = () => (
  <div className="flex justify-center py-16">
    <span className="loading loading-spinner loading-md text-primary" />
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="alert alert-error rounded-2xl shadow-sm">
    <FiAlertCircle size={18} />
    <span className="text-sm">{message}</span>
    {onRetry && (
      <button className="btn btn-sm btn-ghost gap-1" onClick={onRetry}>
        <FiRefreshCw size={13} /> Thử lại
      </button>
    )}
  </div>
);

export const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
  bg = "bg-primary/10",
}) => (
  <div className="bg-base-100 border border-base-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div
      className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}
    >
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-xs text-base-content/50 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-base-content">{value}</p>
      {sub && <p className="text-xs text-base-content/40 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export const Pagination = ({ pagination, onChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages } = pagination;
  return (
    <div className="flex justify-center gap-2 pt-2">
      <button
        className="btn btn-sm btn-ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      <span className="btn btn-sm btn-ghost no-animation cursor-default">
        {page} / {totalPages}
      </span>
      <button
        className="btn btn-sm btn-ghost"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </div>
  );
};