import {
  FiUsers, FiBookOpen, FiDollarSign, FiStar,
  FiCheckCircle, FiCreditCard, FiAlertCircle,
} from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, StatCard } from "../shared";
import { TUTOR_STATUS, fmtDate, fmtUsd, avatar } from "../shared/statusMaps";

export default function DashboardSection({ onNavigate }) {
  const { data: stats, loading, error, reload } = useAdminData(() => adminApi.getStats());
  const { data: approvalsData } = useAdminData(() => adminApi.getTutorApprovals({ limit: 4 }));
  const { data: paymentsData  } = useAdminData(() => adminApi.getPayments({ limit: 4 }));

  if (loading) return <Spinner />;
  if (error)   return <ErrorBox message={error} onRetry={reload} />;

  const recentApprovals = approvalsData?.profiles ?? [];
  const recentPayments  = paymentsData?.payments  ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-base-content mb-1">Tổng quan hệ thống</h2>
        <p className="text-sm text-base-content/50">Dữ liệu realtime từ toàn bộ nền tảng</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiUsers} label="Tổng người dùng"
          value={stats.totalUsers.toLocaleString()}
          sub={`${stats.totalTutors} gia sư · ${stats.totalStudents} học viên`}
          color="text-primary" bg="bg-primary/10"
        />
        <StatCard
          icon={FiBookOpen} label="Khoá học"
          value={stats.totalCourses.toLocaleString()}
          sub={`${stats.activeCourses} đang hoạt động`}
          color="text-info" bg="bg-info/10"
        />
        <StatCard
          icon={FiDollarSign} label="Doanh thu"
          value={fmtUsd(stats.totalRevenue)}
          sub={`${fmtUsd(stats.pendingPayouts)} chờ chi`}
          color="text-success" bg="bg-success/10"
        />
        <StatCard
          icon={FiStar} label="Đánh giá TB"
          value={stats.avgRating.toFixed(1)}
          sub={`${stats.totalReviews.toLocaleString()} lượt`}
          color="text-warning" bg="bg-warning/10"
        />
      </div>

      {/* Pending approvals alert */}
      {stats.pendingApprovals > 0 && (
        <div
          className="alert alert-warning shadow-sm rounded-2xl cursor-pointer"
          onClick={() => onNavigate("approvals")}
        >
          <FiAlertCircle size={18} />
          <span className="text-sm font-medium">
            Có <strong>{stats.pendingApprovals}</strong> hồ sơ gia sư đang chờ duyệt.
            <span className="underline ml-1">Xem ngay →</span>
          </span>
        </div>
      )}

      {/* Recent lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent approvals */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-base-content mb-4 flex items-center gap-2">
            <FiCheckCircle size={15} className="text-warning" /> Hồ sơ chờ duyệt gần đây
          </h3>
          <div className="space-y-3">
            {recentApprovals.length === 0 && (
              <p className="text-xs text-base-content/40 text-center py-4">Không có hồ sơ nào</p>
            )}
            {recentApprovals.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <img
                  src={a.user.avatar || avatar(a.user.name)}
                  className="w-8 h-8 rounded-full object-cover"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content truncate">{a.user.name}</p>
                  <p className="text-xs text-base-content/50">{a.subjects?.[0] ?? "—"}</p>
                </div>
                <span className={`badge ${TUTOR_STATUS[a.status]?.badge} badge-sm`}>
                  {TUTOR_STATUS[a.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-base-content mb-4 flex items-center gap-2">
            <FiCreditCard size={15} className="text-success" /> Giao dịch gần đây
          </h3>
          <div className="space-y-3">
            {recentPayments.length === 0 && (
              <p className="text-xs text-base-content/40 text-center py-4">Chưa có giao dịch</p>
            )}
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                  <FiCreditCard size={13} className="text-base-content/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content truncate">
                    {p.student.name} → {p.tutorProfile.user.name}
                  </p>
                  <p className="text-xs text-base-content/50">{fmtDate(p.createdAt)}</p>
                </div>
                <span className="text-sm font-bold text-success">{fmtUsd(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}