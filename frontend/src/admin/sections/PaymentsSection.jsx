import { useState } from "react";
import { FiCreditCard, FiDollarSign, FiCheck } from "react-icons/fi";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, Pagination } from "../shared";
import { PAYMENT_STATUS, WITHDRAWAL_STATUS, fmtDate, fmtUsd } from "../shared/statusMaps";

export default function PaymentsSection() {
  const [tab, setTab]               = useState("payments"); // "payments" | "withdrawals"
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState("");
  const [processing, setProcessing] = useState(null);

  const {
    data: payData, loading: payLoading, error: payErr, reload: reloadPay,
  } = useAdminData(
    () => adminApi.getPayments({ page, limit: 15, status: statusFilter || undefined }),
    [page, statusFilter, tab],
  );

  const {
    data: wdData, loading: wdLoading, error: wdErr, reload: reloadWd,
  } = useAdminData(
    () => adminApi.getWithdrawals({ page, limit: 15, status: statusFilter || undefined }),
    [page, statusFilter, tab],
  );

  const handleProcessWithdrawal = async (id, status) => {
    setProcessing(id + "_" + status);
    try {
      await adminApi.processWithdrawal(id, status);
      reloadWd();
    } catch (err) { alert(err.message); }
    finally { setProcessing(null); }
  };

  const payments    = payData?.payments    ?? [];
  const withdrawals = wdData?.withdrawals  ?? [];
  const pagination  = tab === "payments" ? payData?.pagination : wdData?.pagination;
  const loading     = tab === "payments" ? payLoading : wdLoading;
  const error       = tab === "payments" ? payErr     : wdErr;
  const reload      = tab === "payments" ? reloadPay  : reloadWd;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-base-content">Thanh toán & Ví</h2>
        <p className="text-sm text-base-content/50">Quản lý giao dịch toàn hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed w-fit">
        <button
          className={`tab ${tab === "payments" ? "tab-active" : ""}`}
          onClick={() => { setTab("payments"); setPage(1); setStatus(""); }}
        >
          Giao dịch
        </button>
        <button
          className={`tab ${tab === "withdrawals" ? "tab-active" : ""}`}
          onClick={() => { setTab("withdrawals"); setPage(1); setStatus(""); }}
        >
          Rút tiền
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-3">
        <select
          className="select select-bordered select-sm"
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả trạng thái</option>
          {tab === "payments" ? (
            <>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="RELEASED">Đã giải phóng</option>
              <option value="REFUNDED">Đã hoàn</option>
              <option value="FAILED">Thất bại</option>
            </>
          ) : (
            <>
              <option value="PENDING">Chờ xử lý</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="FAILED">Thất bại</option>
            </>
          )}
        </select>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner />
        ) : tab === "payments" ? (
          /* ── Payments table ── */
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead className="bg-base-200/60">
                <tr>
                  <th>Học viên</th>
                  <th>Gia sư</th>
                  <th>Khoá học</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hover">
                    <td className="text-sm font-medium">{p.student.name}</td>
                    <td className="text-sm">{p.tutorProfile.user.name}</td>
                    <td className="text-sm text-base-content/60">{p.courseClass.subject}</td>
                    <td className="text-sm font-bold">{fmtUsd(p.amount)}</td>
                    <td>
                      <span className={`badge ${PAYMENT_STATUS[p.status]?.badge} badge-sm`}>
                        {PAYMENT_STATUS[p.status]?.label}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/60">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="flex flex-col items-center py-12 text-base-content/30 gap-2">
                <FiCreditCard size={32} className="opacity-30" />
                <p className="text-sm">Không có giao dịch nào</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Withdrawals table ── */
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead className="bg-base-200/60">
                <tr>
                  <th>Gia sư</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                  <th>Yêu cầu lúc</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover">
                    <td className="text-sm font-medium">{w.wallet.tutorProfile.user.name}</td>
                    <td className="text-sm font-bold">{fmtUsd(w.amount)}</td>
                    <td>
                      <span className={`badge ${WITHDRAWAL_STATUS[w.status]?.badge} badge-sm`}>
                        {WITHDRAWAL_STATUS[w.status]?.label}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/60">{fmtDate(w.requestedAt)}</td>
                    <td>
                      {w.status === "PENDING" && (
                        <div className="flex gap-1">
                          <button
                            className="btn btn-xs btn-info gap-1"
                            disabled={!!processing}
                            onClick={() => handleProcessWithdrawal(w.id, "PROCESSING")}
                          >
                            {processing === w.id + "_PROCESSING" ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : "Xử lý"}
                          </button>
                          <button
                            className="btn btn-xs btn-error btn-outline"
                            disabled={!!processing}
                            onClick={() => handleProcessWithdrawal(w.id, "FAILED")}
                          >
                            Huỷ
                          </button>
                        </div>
                      )}
                      {w.status === "PROCESSING" && (
                        <button
                          className="btn btn-xs btn-success gap-1"
                          disabled={!!processing}
                          onClick={() => handleProcessWithdrawal(w.id, "COMPLETED")}
                        >
                          {processing === w.id + "_COMPLETED" ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <><FiCheck size={11} /> Hoàn tất</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withdrawals.length === 0 && (
              <div className="flex flex-col items-center py-12 text-base-content/30 gap-2">
                <FiDollarSign size={32} className="opacity-30" />
                <p className="text-sm">Không có yêu cầu rút tiền nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onChange={setPage} />
    </div>
  );
}