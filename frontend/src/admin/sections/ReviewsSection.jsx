import { useState } from "react";
import { FiStar, FiAlertCircle, FiXCircle } from "react-icons/fi";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, Pagination } from "../shared";
import { fmtDate, avatar } from "../shared/statusMaps";

export default function ReviewsSection() {
  const [page, setPage]         = useState(1);
  const [flagged, setFlagged]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { data, loading, error, reload } = useAdminData(
    () => adminApi.getReviews({ page, limit: 12, flagged: flagged || undefined }),
    [page, flagged],
  );

  const reviews    = data?.reviews    ?? [];
  const pagination = data?.pagination;

  const handleDelete = async (id) => {
    if (!confirm("Xoá đánh giá này?")) return;
    setDeleting(id);
    try {
      await adminApi.deleteReview(id);
      reload();
    } catch (err) { alert(err.message); }
    finally { setDeleting(null); }
  };

  const renderStars = (n) =>
    Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < n ? "text-warning" : "text-base-300"}>★</span>
    ));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Đánh giá</h2>
          <p className="text-sm text-base-content/50">
            {pagination?.total?.toLocaleString() ?? "—"} đánh giá
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-base-content/60">Chỉ hiện bị gắn cờ (≤ 2★)</span>
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-warning"
            checked={flagged}
            onChange={(e) => { setFlagged(e.target.checked); setPage(1); }}
          />
        </label>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => {
            const isFlagged = r.rating <= 2;
            return (
              <div
                key={r.id}
                className={`bg-base-100 border rounded-2xl p-5 shadow-sm ${
                  isFlagged ? "border-error/40" : "border-base-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={r.student.avatar || avatar(r.student.name)}
                      className="w-8 h-8 rounded-full object-cover"
                      alt=""
                    />
                    <div>
                      <p className="text-sm font-semibold text-base-content">{r.student.name}</p>
                      <p className="text-xs text-base-content/50">
                        → {r.tutorProfile.user.name} · {r.courseClass.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isFlagged && (
                      <span className="badge badge-error badge-sm gap-1">
                        <FiAlertCircle size={10} /> Gắn cờ
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-xs btn-circle text-error"
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                    >
                      {deleting === r.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <FiXCircle size={14} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2 text-base">{renderStars(r.rating)}</div>
                <p className="text-sm text-base-content/70 italic">"{r.comment}"</p>
                <p className="text-xs text-base-content/30 mt-2">{fmtDate(r.createdAt)}</p>
              </div>
            );
          })}
          {reviews.length === 0 && (
            <div className="col-span-2 flex flex-col items-center py-12 text-base-content/30 gap-2">
              <FiStar size={32} className="opacity-30" />
              <p className="text-sm">Không có đánh giá nào</p>
            </div>
          )}
        </div>
      )}

      <Pagination pagination={pagination} onChange={setPage} />
    </div>
  );
}