import { useState } from "react";
import { FiCheckCircle, FiClock, FiEye, FiCheck, FiXCircle } from "react-icons/fi";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, Pagination } from "../shared";
import { TUTOR_STATUS, fmtDate, avatar } from "../shared/statusMaps";
import TutorDetailModal from "./TutorDetailModal";

export default function ApprovalsSection() {
  const [page, setPage]           = useState(1);
  const [actionLoading, setActionLoading] = useState(null); // "id_approve" | "id_reject"
  const [rejectNote, setRejectNote]       = useState({});   // { [id]: string }
  const [viewingId, setViewingId]         = useState(null); // tutorProfileId cho modal

  const { data, error, reload, loading: fetching } = useAdminData(
    () => adminApi.getTutorApprovals({ page, limit: 12 }),
    [page],
  );

  const profiles   = data?.profiles ?? [];
  const pagination = data?.pagination;

  const handleApprove = async (id) => {
    setActionLoading(id + "_approve");
    try {
      await adminApi.approveTutor(id);
      reload();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id) => {
    setActionLoading(id + "_reject");
    try {
      await adminApi.rejectTutor(id, rejectNote[id] ?? "");
      reload();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  if (fetching) return <Spinner />;

  return (
    <>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-base-content">Duyệt hồ sơ gia sư</h2>
          <p className="text-sm text-base-content/50">
            {pagination?.total ?? 0} hồ sơ đang chờ xử lý
          </p>
        </div>

        {error && <ErrorBox message={error} onRetry={reload} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((a) => {
            const isDone = a.status === "APPROVED" || a.status === "REJECTED";
            return (
              <div
                key={a.id}
                className={`bg-base-100 border rounded-2xl p-5 shadow-sm transition-all ${
                  isDone
                    ? "opacity-60 border-base-200"
                    : "border-base-200 hover:shadow-md"
                }`}
              >
                {/* Top info */}
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={a.user.avatar || avatar(a.user.name)}
                    className="w-11 h-11 rounded-full object-cover border-2 border-base-200 shrink-0"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-base-content">{a.user.name}</p>
                    <p className="text-xs text-base-content/50">{a.user.email}</p>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      Môn:{" "}
                      <span className="font-medium text-base-content">
                        {a.subjects?.join(", ") || "—"}
                      </span>
                    </p>
                  </div>
                  <span className={`badge ${TUTOR_STATUS[a.status]?.badge} badge-sm shrink-0`}>
                    {TUTOR_STATUS[a.status]?.label}
                  </span>
                </div>

                {/* Meta + xem hồ sơ */}
                <div className="flex items-center justify-between text-xs text-base-content/40 mb-3">
                  <span className="flex items-center gap-1">
                    <FiClock size={11} /> Nộp: {fmtDate(a.createdAt)}
                  </span>
                  <button
                    className="btn btn-ghost btn-xs gap-1 text-primary"
                    onClick={() => setViewingId(a.id)}
                  >
                    <FiEye size={11} /> Xem hồ sơ
                  </button>
                </div>

                {/* Actions */}
                {!isDone && (
                  <>
                    <textarea
                      className="textarea textarea-bordered textarea-xs w-full mb-2 text-xs resize-none"
                      placeholder="Lý do từ chối (để trống nếu duyệt)…"
                      rows={2}
                      value={rejectNote[a.id] ?? ""}
                      onChange={(e) =>
                        setRejectNote((prev) => ({ ...prev, [a.id]: e.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-success flex-1 gap-1"
                        onClick={() => handleApprove(a.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === a.id + "_approve" ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FiCheck size={13} />
                        )}
                        Duyệt
                      </button>
                      <button
                        className="btn btn-sm btn-error btn-outline flex-1 gap-1"
                        onClick={() => handleReject(a.id)}
                        disabled={!!actionLoading || !rejectNote[a.id]?.trim()}
                      >
                        {actionLoading === a.id + "_reject" ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FiXCircle size={13} />
                        )}
                        Từ chối
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {profiles.length === 0 && !fetching && (
            <div className="col-span-2 flex flex-col items-center py-16 text-base-content/30 gap-2">
              <FiCheckCircle size={36} className="opacity-30" />
              <p className="text-sm">Không có hồ sơ nào cần duyệt</p>
            </div>
          )}
        </div>

        <Pagination pagination={pagination} onChange={setPage} />
      </div>

      {/* Modal xem chi tiết */}
      {viewingId && (
        <TutorDetailModal
          tutorProfileId={viewingId}
          onClose={() => setViewingId(null)}
        />
      )}
    </>
  );
}