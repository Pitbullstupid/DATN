import { useState, useCallback } from "react";
import {
  FiHome,
  FiUsers,
  FiBookOpen,
  FiCreditCard,
  FiStar,
  FiCheckCircle,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiSettings,
  FiTrendingUp,
  FiAlertCircle,
  FiEye,
  FiCheck,
  FiXCircle,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiDollarSign,
  FiClock,
} from "react-icons/fi";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import ThemeSelector from "../components/ThemeSelector";

// ─── Mock Data (thay bằng API call thực tế) ──────────────────────────────────
// TODO: Replace with axiosInstance.get('/admin/stats')
const MOCK_STATS = {
  totalUsers: 1_284,
  totalTutors: 312,
  totalStudents: 972,
  totalCourses: 847,
  activeCourses: 234,
  totalRevenue: 48_920.5,
  pendingPayouts: 3_210.0,
  pendingApprovals: 7,
  avgRating: 4.6,
  totalReviews: 3_891,
};

// TODO: Replace with axiosInstance.get('/admin/tutor-approvals')
const MOCK_APPROVALS = [
  {
    id: "t1",
    name: "Nguyễn Văn An",
    email: "an.nguyen@mail.com",
    subject: "Toán",
    avatar: "",
    createdAt: "2025-05-20",
    status: "PENDING",
  },
  {
    id: "t2",
    name: "Trần Thị Bích",
    email: "bich.tran@mail.com",
    subject: "Tiếng Anh",
    avatar: "",
    createdAt: "2025-05-21",
    status: "PENDING",
  },
  {
    id: "t3",
    name: "Lê Minh Cường",
    email: "cuong.le@mail.com",
    subject: "Vật lý",
    avatar: "",
    createdAt: "2025-05-22",
    status: "REVIEWING",
  },
  {
    id: "t4",
    name: "Phạm Thanh Dung",
    email: "dung.pham@mail.com",
    subject: "Hoá học",
    avatar: "",
    createdAt: "2025-05-23",
    status: "PENDING",
  },
  {
    id: "t5",
    name: "Hoàng Quốc Khánh",
    email: "khanh.hoang@mail.com",
    subject: "Lập trình",
    avatar: "",
    createdAt: "2025-05-24",
    status: "REVIEWING",
  },
  {
    id: "t6",
    name: "Vũ Thu Hà",
    email: "ha.vu@mail.com",
    subject: "Lịch sử",
    avatar: "",
    createdAt: "2025-05-24",
    status: "PENDING",
  },
  {
    id: "t7",
    name: "Đặng Hữu Nghĩa",
    email: "nghia.dang@mail.com",
    subject: "Sinh học",
    avatar: "",
    createdAt: "2025-05-25",
    status: "PENDING",
  },
];

// TODO: Replace with axiosInstance.get('/admin/users')
const MOCK_USERS = [
  {
    id: "u1",
    name: "Minh Châu",
    email: "chau@mail.com",
    role: "STUDENT",
    status: "ACTIVE",
    joinDate: "2025-01-10",
    courses: 3,
  },
  {
    id: "u2",
    name: "Bảo Trân",
    email: "tran@mail.com",
    role: "TUTOR",
    status: "ACTIVE",
    joinDate: "2025-02-14",
    courses: 12,
  },
  {
    id: "u3",
    name: "Gia Huy",
    email: "huy@mail.com",
    role: "STUDENT",
    status: "ACTIVE",
    joinDate: "2025-03-01",
    courses: 1,
  },
  {
    id: "u4",
    name: "Diệu Linh",
    email: "linh@mail.com",
    role: "TUTOR",
    status: "SUSPENDED",
    joinDate: "2025-01-22",
    courses: 5,
  },
  {
    id: "u5",
    name: "Tuấn Kiệt",
    email: "kiet@mail.com",
    role: "STUDENT",
    status: "ACTIVE",
    joinDate: "2025-04-05",
    courses: 2,
  },
  {
    id: "u6",
    name: "Phương Nhi",
    email: "nhi@mail.com",
    role: "STUDENT",
    status: "ACTIVE",
    joinDate: "2025-04-18",
    courses: 0,
  },
  {
    id: "u7",
    name: "Công Danh",
    email: "danh@mail.com",
    role: "TUTOR",
    status: "ACTIVE",
    joinDate: "2025-05-01",
    courses: 8,
  },
  {
    id: "u8",
    name: "Bích Ngọc",
    email: "ngoc@mail.com",
    role: "STUDENT",
    status: "INACTIVE",
    joinDate: "2025-02-28",
    courses: 1,
  },
];

// TODO: Replace with axiosInstance.get('/admin/courses')
const MOCK_COURSES = [
  {
    id: "c1",
    subject: "Toán nâng cao",
    tutor: "Bảo Trân",
    student: "Minh Châu",
    status: "ONGOING",
    startDate: "2025-04-01",
    sessions: 8,
    totalSessions: 20,
    pricePerSession: 15,
  },
  {
    id: "c2",
    subject: "IELTS Speaking",
    tutor: "Công Danh",
    student: "Gia Huy",
    status: "UPCOMING",
    startDate: "2025-05-30",
    sessions: 0,
    totalSessions: 10,
    pricePerSession: 20,
  },
  {
    id: "c3",
    subject: "Lập trình Python",
    tutor: "Bảo Trân",
    student: "Tuấn Kiệt",
    status: "COMPLETED",
    startDate: "2025-02-01",
    sessions: 15,
    totalSessions: 15,
    pricePerSession: 18,
  },
  {
    id: "c4",
    subject: "Vật lý đại cương",
    tutor: "Công Danh",
    student: "Phương Nhi",
    status: "CANCELLED",
    startDate: "2025-03-15",
    sessions: 2,
    totalSessions: 12,
    pricePerSession: 12,
  },
  {
    id: "c5",
    subject: "Hoá học hữu cơ",
    tutor: "Bảo Trân",
    student: "Bích Ngọc",
    status: "ONGOING",
    startDate: "2025-04-20",
    sessions: 4,
    totalSessions: 16,
    pricePerSession: 14,
  },
  {
    id: "c6",
    subject: "Tiếng Nhật N3",
    tutor: "Công Danh",
    student: "Minh Châu",
    status: "ONGOING",
    startDate: "2025-05-01",
    sessions: 3,
    totalSessions: 24,
    pricePerSession: 22,
  },
];

// TODO: Replace with axiosInstance.get('/admin/reviews')
const MOCK_REVIEWS = [
  {
    id: "r1",
    student: "Minh Châu",
    tutor: "Bảo Trân",
    subject: "Toán nâng cao",
    rating: 5,
    comment: "Gia sư rất tận tâm, giải thích dễ hiểu!",
    createdAt: "2025-05-10",
    flagged: false,
  },
  {
    id: "r2",
    student: "Gia Huy",
    tutor: "Công Danh",
    subject: "Lập trình Python",
    rating: 3,
    comment: "Ổn, nhưng đôi khi bài giảng hơi nhanh.",
    createdAt: "2025-05-12",
    flagged: false,
  },
  {
    id: "r3",
    student: "Tuấn Kiệt",
    tutor: "Bảo Trân",
    subject: "IELTS",
    rating: 1,
    comment: "Không hài lòng, gia sư hay đến muộn.",
    createdAt: "2025-05-15",
    flagged: true,
  },
  {
    id: "r4",
    student: "Bích Ngọc",
    tutor: "Công Danh",
    subject: "Vật lý",
    rating: 4,
    comment: "Tốt, sẽ tiếp tục học.",
    createdAt: "2025-05-18",
    flagged: false,
  },
  {
    id: "r5",
    student: "Phương Nhi",
    tutor: "Bảo Trân",
    subject: "Hoá học",
    rating: 5,
    comment: "Xuất sắc! Điểm thi tăng hẳn.",
    createdAt: "2025-05-20",
    flagged: false,
  },
];

// TODO: Replace with axiosInstance.get('/admin/payments')
const MOCK_PAYMENTS = [
  {
    id: "p1",
    student: "Minh Châu",
    tutor: "Bảo Trân",
    amount: 120,
    type: "PAYMENT",
    status: "COMPLETED",
    createdAt: "2025-05-01",
  },
  {
    id: "p2",
    student: "Gia Huy",
    tutor: "Công Danh",
    amount: 200,
    type: "PAYOUT",
    status: "PENDING",
    createdAt: "2025-05-10",
  },
  {
    id: "p3",
    student: "Tuấn Kiệt",
    tutor: "Bảo Trân",
    amount: 270,
    type: "PAYMENT",
    status: "COMPLETED",
    createdAt: "2025-05-15",
  },
  {
    id: "p4",
    student: "Bích Ngọc",
    tutor: "Công Danh",
    amount: 88,
    type: "REFUND",
    status: "COMPLETED",
    createdAt: "2025-05-18",
  },
  {
    id: "p5",
    student: "Phương Nhi",
    tutor: "Bảo Trân",
    amount: 440,
    type: "PAYOUT",
    status: "PENDING",
    createdAt: "2025-05-22",
  },
  {
    id: "p6",
    student: "Minh Châu",
    tutor: "Công Danh",
    amount: 330,
    type: "PAYMENT",
    status: "COMPLETED",
    createdAt: "2025-05-24",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const fmtUsd = (v) =>
  `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "?")}&size=80&background=random`;

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "dashboard", label: "Tổng quan", icon: FiHome },
  { key: "users", label: "Người dùng", icon: FiUsers },
  {
    key: "approvals",
    label: "Duyệt gia sư",
    icon: FiCheckCircle,
    badge: MOCK_STATS.pendingApprovals,
  },
  { key: "courses", label: "Khoá học", icon: FiBookOpen },
  { key: "payments", label: "Thanh toán", icon: FiCreditCard },
  { key: "reviews", label: "Đánh giá", icon: FiStar },
];

// ─── Status styles ────────────────────────────────────────────────────────────
const COURSE_STATUS = {
  UPCOMING: { badge: "badge-info", label: "Sắp tới" },
  ONGOING: { badge: "badge-warning", label: "Đang học" },
  COMPLETED: { badge: "badge-success", label: "Hoàn thành" },
  CANCELLED: { badge: "badge-error", label: "Đã huỷ" },
  PENDING_PAYMENT: { badge: "badge-ghost", label: "Chờ thanh toán" },
};

const PAYMENT_STATUS = {
  COMPLETED: { badge: "badge-success", label: "Hoàn thành" },
  PENDING: { badge: "badge-warning", label: "Chờ xử lý" },
  FAILED: { badge: "badge-error", label: "Thất bại" },
};

const PAYMENT_TYPE = {
  PAYMENT: { badge: "badge-info badge-outline", label: "Thu" },
  PAYOUT: { badge: "badge-success badge-outline", label: "Chi" },
  REFUND: { badge: "badge-error badge-outline", label: "Hoàn" },
};

const USER_STATUS = {
  ACTIVE: { badge: "badge-success", label: "Hoạt động" },
  SUSPENDED: { badge: "badge-error", label: "Tạm khoá" },
  INACTIVE: { badge: "badge-ghost", label: "Không hoạt động" },
};

const APPROVAL_STATUS = {
  PENDING: { badge: "badge-warning", label: "Chờ duyệt" },
  REVIEWING: { badge: "badge-info", label: "Đang xét" },
  APPROVED: { badge: "badge-success", label: "Đã duyệt" },
  REJECTED: { badge: "badge-error", label: "Từ chối" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({
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

// ─── Section: Dashboard Overview ──────────────────────────────────────────────
const DashboardSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-base-content mb-1">
        Tổng quan hệ thống
      </h2>
      <p className="text-sm text-base-content/50">
        Dữ liệu realtime từ toàn bộ nền tảng
      </p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={FiUsers}
        label="Tổng người dùng"
        value={MOCK_STATS.totalUsers.toLocaleString()}
        sub={`${MOCK_STATS.totalTutors} gia sư · ${MOCK_STATS.totalStudents} học viên`}
        color="text-primary"
        bg="bg-primary/10"
      />
      <StatCard
        icon={FiBookOpen}
        label="Khoá học"
        value={MOCK_STATS.totalCourses.toLocaleString()}
        sub={`${MOCK_STATS.activeCourses} đang hoạt động`}
        color="text-info"
        bg="bg-info/10"
      />
      <StatCard
        icon={FiDollarSign}
        label="Doanh thu"
        value={fmtUsd(MOCK_STATS.totalRevenue)}
        sub={`${fmtUsd(MOCK_STATS.pendingPayouts)} chờ chi`}
        color="text-success"
        bg="bg-success/10"
      />
      <StatCard
        icon={FiStar}
        label="Đánh giá TB"
        value={MOCK_STATS.avgRating.toFixed(1)}
        sub={`${MOCK_STATS.totalReviews.toLocaleString()} lượt đánh giá`}
        color="text-warning"
        bg="bg-warning/10"
      />
    </div>

    {/* Pending approvals alert */}
    {MOCK_STATS.pendingApprovals > 0 && (
      <div className="alert alert-warning shadow-sm rounded-2xl">
        <FiAlertCircle size={18} />
        <span className="text-sm font-medium">
          Có <strong>{MOCK_STATS.pendingApprovals}</strong> hồ sơ gia sư đang
          chờ duyệt.
        </span>
      </div>
    )}

    {/* Quick stats grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Recent approvals preview */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-base-content mb-4 flex items-center gap-2">
          <FiCheckCircle size={15} className="text-warning" /> Hồ sơ chờ duyệt
          gần đây
        </h3>
        <div className="space-y-3">
          {MOCK_APPROVALS.slice(0, 4).map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <img
                src={avatar(a.name)}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content truncate">
                  {a.name}
                </p>
                <p className="text-xs text-base-content/50">{a.subject}</p>
              </div>
              <span
                className={`badge ${APPROVAL_STATUS[a.status].badge} badge-sm`}
              >
                {APPROVAL_STATUS[a.status].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent payments preview */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-base-content mb-4 flex items-center gap-2">
          <FiCreditCard size={15} className="text-success" /> Giao dịch gần đây
        </h3>
        <div className="space-y-3">
          {MOCK_PAYMENTS.slice(0, 4).map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                <FiCreditCard size={13} className="text-base-content/50" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content truncate">
                  {p.student} → {p.tutor}
                </p>
                <p className="text-xs text-base-content/50">
                  {fmtDate(p.createdAt)}
                </p>
              </div>
              <span className="text-sm font-bold text-success">
                {fmtUsd(p.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Section: Users ───────────────────────────────────────────────────────────
const UsersSection = () => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const filtered = MOCK_USERS.filter(
    (u) =>
      (!roleFilter || u.role === roleFilter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Người dùng</h2>
          <p className="text-sm text-base-content/50">
            {MOCK_STATS.totalUsers.toLocaleString()} tài khoản
          </p>
        </div>
        {/* TODO: export button → axiosInstance.get('/admin/users/export') */}
      </div>

      <div className="flex gap-3 flex-wrap">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[200px]">
          <FiSearch size={14} className="text-base-content/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            className="grow"
          />
        </label>
        <select
          className="select select-bordered select-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="STUDENT">Học viên</option>
          <option value="TUTOR">Gia sư</option>
        </select>
      </div>

      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tham gia</th>
                <th>Khoá học</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={avatar(u.name)}
                        className="w-8 h-8 rounded-full object-cover"
                        alt=""
                      />
                      <div>
                        <p className="font-medium text-sm text-base-content">
                          {u.name}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-xs">
                      {u.role === "TUTOR" ? (
                        <FaChalkboardTeacher className="text-primary" />
                      ) : (
                        <FaUserGraduate className="text-info" />
                      )}
                      {u.role === "TUTOR" ? "Gia sư" : "Học viên"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${USER_STATUS[u.status].badge} badge-sm`}
                    >
                      {USER_STATUS[u.status].label}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/60">
                    {fmtDate(u.joinDate)}
                  </td>
                  <td className="text-sm font-medium">{u.courses}</td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <button
                        tabIndex={0}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        <FiMoreVertical size={14} />
                      </button>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-200 text-sm"
                      >
                        {/* TODO: axiosInstance.get(`/admin/users/${u.id}`) */}
                        <li>
                          <a>Xem chi tiết</a>
                        </li>
                        {/* TODO: axiosInstance.patch(`/admin/users/${u.id}/suspend`) */}
                        <li>
                          <a className="text-error">
                            {u.status === "SUSPENDED" ? "Mở khoá" : "Tạm khoá"}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-base-content/30 gap-2">
            <FiSearch size={32} className="opacity-30" />
            <p className="text-sm">Không tìm thấy kết quả</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Section: Tutor Approvals ─────────────────────────────────────────────────
const ApprovalsSection = () => {
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);
  const [loading, setLoading] = useState(null);

  const handleApprove = useCallback(async (id) => {
    setLoading(id + "_approve");
    // TODO: await axiosInstance.patch(`/admin/tutors/${id}/approve`)
    await new Promise((r) => setTimeout(r, 800));
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "APPROVED" } : a)),
    );
    setLoading(null);
  }, []);

  const handleReject = useCallback(async (id) => {
    setLoading(id + "_reject");
    // TODO: await axiosInstance.patch(`/admin/tutors/${id}/reject`)
    await new Promise((r) => setTimeout(r, 800));
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "REJECTED" } : a)),
    );
    setLoading(null);
  }, []);

  const pending = approvals.filter(
    (a) => a.status === "PENDING" || a.status === "REVIEWING",
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-base-content">
          Duyệt hồ sơ gia sư
        </h2>
        <p className="text-sm text-base-content/50">
          {pending.length} hồ sơ đang chờ xử lý
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {approvals.map((a) => {
          const isDone = a.status === "APPROVED" || a.status === "REJECTED";
          return (
            <div
              key={a.id}
              className={`bg-base-100 border rounded-2xl p-5 shadow-sm transition-all ${isDone ? "opacity-60 border-base-200" : "border-base-200 hover:shadow-md"}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <img
                  src={avatar(a.name)}
                  className="w-11 h-11 rounded-full object-cover border-2 border-base-200 shrink-0"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-base-content">
                    {a.name}
                  </p>
                  <p className="text-xs text-base-content/50">{a.email}</p>
                  <p className="text-xs text-base-content/50 mt-0.5">
                    Môn:{" "}
                    <span className="font-medium text-base-content">
                      {a.subject}
                    </span>
                  </p>
                </div>
                <span
                  className={`badge ${APPROVAL_STATUS[a.status].badge} badge-sm shrink-0`}
                >
                  {APPROVAL_STATUS[a.status].label}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-base-content/40 mb-4">
                <span className="flex items-center gap-1">
                  <FiClock size={11} /> Nộp: {fmtDate(a.createdAt)}
                </span>
                {/* TODO: nút xem profile → navigate(`/admin/tutors/${a.id}`) */}
                <button className="btn btn-ghost btn-xs gap-1 text-primary">
                  <FiEye size={11} /> Xem hồ sơ
                </button>
              </div>

              {!isDone && (
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-success flex-1 gap-1"
                    onClick={() => handleApprove(a.id)}
                    disabled={!!loading}
                  >
                    {loading === a.id + "_approve" ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <FiCheck size={13} />
                    )}
                    Duyệt
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline flex-1 gap-1"
                    onClick={() => handleReject(a.id)}
                    disabled={!!loading}
                  >
                    {loading === a.id + "_reject" ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <FiXCircle size={13} />
                    )}
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Section: Courses ─────────────────────────────────────────────────────────
const CoursesSection = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const filtered = MOCK_COURSES.filter(
    (c) => !statusFilter || c.status === statusFilter,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Khoá học</h2>
          <p className="text-sm text-base-content/50">
            {MOCK_STATS.totalCourses.toLocaleString()} khoá học
          </p>
        </div>
        <select
          className="select select-bordered select-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="UPCOMING">Sắp tới</option>
          <option value="ONGOING">Đang học</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã huỷ</option>
        </select>
      </div>

      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th>Môn học</th>
                <th>Gia sư</th>
                <th>Học viên</th>
                <th>Trạng thái</th>
                <th>Tiến độ</th>
                <th>Giá/buổi</th>
                <th>Bắt đầu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const pct =
                  c.totalSessions > 0
                    ? Math.round((c.sessions / c.totalSessions) * 100)
                    : 0;
                const st = COURSE_STATUS[c.status] ?? COURSE_STATUS.UPCOMING;
                return (
                  <tr key={c.id} className="hover">
                    <td className="font-medium text-sm">{c.subject}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm">
                        <FaChalkboardTeacher
                          size={12}
                          className="text-primary shrink-0"
                        />
                        {c.tutor}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm">
                        <FaUserGraduate
                          size={12}
                          className="text-info shrink-0"
                        />
                        {c.student}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${st.badge} badge-sm`}>
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[80px]">
                        <div className="flex-1 bg-base-300 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-base-content/50 shrink-0">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="text-success font-semibold text-sm">
                      {fmtUsd(c.pricePerSession)}
                    </td>
                    <td className="text-sm text-base-content/60">
                      {fmtDate(c.startDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Payments ────────────────────────────────────────────────────────
const PaymentsSection = () => {
  const [typeFilter, setTypeFilter] = useState("");
  const filtered = MOCK_PAYMENTS.filter(
    (p) => !typeFilter || p.type === typeFilter,
  );
  const totalIn = MOCK_PAYMENTS.filter(
    (p) => p.type === "PAYMENT" && p.status === "COMPLETED",
  ).reduce((s, p) => s + p.amount, 0);
  const totalOut = MOCK_PAYMENTS.filter(
    (p) => p.type === "PAYOUT" && p.status === "COMPLETED",
  ).reduce((s, p) => s + p.amount, 0);
  const pending = MOCK_PAYMENTS.filter((p) => p.status === "PENDING").reduce(
    (s, p) => s + p.amount,
    0,
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-base-content">Thanh toán & Ví</h2>
        <p className="text-sm text-base-content/50">
          Quản lý giao dịch toàn hệ thống
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={FiTrendingUp}
          label="Tổng thu"
          value={fmtUsd(totalIn)}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={FiDollarSign}
          label="Tổng chi"
          value={fmtUsd(totalOut)}
          color="text-error"
          bg="bg-error/10"
        />
        <StatCard
          icon={FiClock}
          label="Đang chờ"
          value={fmtUsd(pending)}
          color="text-warning"
          bg="bg-warning/10"
        />
      </div>

      <div className="flex gap-3">
        <select
          className="select select-bordered select-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="PAYMENT">Thu</option>
          <option value="PAYOUT">Chi</option>
          <option value="REFUND">Hoàn tiền</option>
        </select>
      </div>

      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/60">
              <tr>
                <th>Học viên</th>
                <th>Gia sư</th>
                <th>Loại</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="hover">
                  <td className="text-sm font-medium">{p.student}</td>
                  <td className="text-sm">{p.tutor}</td>
                  <td>
                    <span
                      className={`badge ${PAYMENT_TYPE[p.type].badge} badge-sm`}
                    >
                      {PAYMENT_TYPE[p.type].label}
                    </span>
                  </td>
                  <td className="text-sm font-bold text-base-content">
                    {fmtUsd(p.amount)}
                  </td>
                  <td>
                    <span
                      className={`badge ${PAYMENT_STATUS[p.status].badge} badge-sm`}
                    >
                      {PAYMENT_STATUS[p.status].label}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/60">
                    {fmtDate(p.createdAt)}
                  </td>
                  <td>
                    {p.status === "PENDING" && (
                      // TODO: axiosInstance.patch(`/admin/payments/${p.id}/release`)
                      <button className="btn btn-xs btn-success gap-1">
                        <FiCheck size={11} /> Giải ngân
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Reviews ─────────────────────────────────────────────────────────
const ReviewsSection = () => {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [showFlagged, setShowFlagged] = useState(false);
  const filtered = showFlagged ? reviews.filter((r) => r.flagged) : reviews;

  const handleDelete = (id) => {
    // TODO: axiosInstance.delete(`/admin/reviews/${id}`)
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const renderStars = (n) =>
    Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < n ? "text-warning" : "text-base-300"}>
        ★
      </span>
    ));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Đánh giá</h2>
          <p className="text-sm text-base-content/50">
            {reviews.length} đánh giá ·{" "}
            {reviews.filter((r) => r.flagged).length} bị gắn cờ
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-base-content/60">
            Chỉ hiện bị gắn cờ
          </span>
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-warning"
            checked={showFlagged}
            onChange={(e) => setShowFlagged(e.target.checked)}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            className={`bg-base-100 border rounded-2xl p-5 shadow-sm ${r.flagged ? "border-error/40" : "border-base-200"}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={avatar(r.student)}
                  className="w-8 h-8 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <p className="text-sm font-semibold text-base-content">
                    {r.student}
                  </p>
                  <p className="text-xs text-base-content/50">
                    → {r.tutor} · {r.subject}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.flagged && (
                  <span className="badge badge-error badge-sm gap-1">
                    <FiAlertCircle size={10} /> Gắn cờ
                  </span>
                )}
                <button
                  className="btn btn-ghost btn-xs btn-circle text-error"
                  onClick={() => handleDelete(r.id)}
                  title="Xoá đánh giá"
                >
                  <FiXCircle size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-2 text-base">
              {renderStars(r.rating)}
            </div>
            <p className="text-sm text-base-content/70 italic">"{r.comment}"</p>
            <p className="text-xs text-base-content/30 mt-2">
              {fmtDate(r.createdAt)}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 flex flex-col items-center py-12 text-base-content/30 gap-2">
            <FiStar size={32} className="opacity-30" />
            <p className="text-sm">Không có đánh giá nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const SECTIONS = {
    dashboard: <DashboardSection />,
    users: <UsersSection />,
    approvals: <ApprovalsSection />,
    courses: <CoursesSection />,
    payments: <PaymentsSection />,
    reviews: <ReviewsSection />,
  };

  const activeNav = NAV_ITEMS.find((n) => n.key === activeSection);

  return (
    <div className="min-h-screen bg-base-200 flex">
      {/* ── Sidebar ── */}
      <aside
        className={`bg-base-100 border-r border-base-200 flex flex-col transition-all duration-300 shrink-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Logo + toggle */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-base-200 shrink-0">
          {!collapsed && (
            <span className="font-bold text-base text-base-content tracking-tight">
              Admin <span className="text-primary">Panel</span>
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <FiMenu size={18} /> : <FiX size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === key
                  ? "bg-primary text-primary-content"
                  : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-left truncate">{label}</span>
              )}
              {!collapsed && badge > 0 && (
                <span
                  className={`badge badge-sm ${activeSection === key ? "badge-ghost" : "badge-error"}`}
                >
                  {badge}
                </span>
              )}
              {collapsed && badge > 0 && (
                <span className="absolute ml-6 -mt-4 badge badge-xs badge-error">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-base-200 p-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-base-content/50 hover:bg-base-200 hover:text-base-content transition-all">
            <FiSettings size={17} className="shrink-0" />
            {!collapsed && <span>Cài đặt</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error/70 hover:bg-error/10 hover:text-error transition-all">
            <FiLogOut size={17} className="shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-base-100 border-b border-base-200 h-16 flex items-center px-6 gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {activeNav?.icon && (
              <activeNav.icon size={18} className="text-primary" />
            )}
            <h1 className="font-semibold text-base-content text-sm">
              {activeNav?.label}
            </h1>
          </div>
          <div className="flex-1" />
          {/* TODO: thêm NotificationBell admin nếu cần */}
          <ThemeSelector />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
            {!collapsed && (
              <span className="text-sm font-medium text-base-content hidden sm:block">
                Admin
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">{SECTIONS[activeSection]}</div>
        </main>
      </div>
    </div>
  );
}
