import {
  FiUsers,
  FiBookOpen,
  FiDollarSign,
  FiStar,
  FiCheckCircle,
  FiCreditCard,
  FiAlertCircle,
} from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, StatCard } from "../shared";
import { TUTOR_STATUS, fmtDate, fmtUsd, avatar } from "../shared/statusMaps";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Chart colour tokens ──────────────────────────────────────
const C = {
  revenue: "#6366f1",
  users: "#22d3ee",
  stars: "#f59e0b",
  courses: ["#22c55e", "#6366f1", "#f59e0b", "#ef4444", "#a855f7"],
};

// ─── Custom tooltip ───────────────────────────────────────────
function ChartTip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-base-100 border border-base-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && (
        <p className="text-base-content/50 mb-1 font-medium">{label}</p>
      )}
      {payload.map((p) => (
        <p
          key={p.name}
          style={{ color: p.color ?? p.fill }}
          className="font-semibold"
        >
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Pie centre label ─────────────────────────────────────────
function PieSliceLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)}
      y={cy + r * Math.sin(-midAngle * R)}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function DashboardSection({ onNavigate }) {
  const {
    data: stats,
    loading,
    error,
    reload,
  } = useAdminData(() => adminApi.getStats());
  const { data: approvalsData } = useAdminData(() =>
    adminApi.getTutorApprovals({ limit: 4 }),
  );
  const { data: paymentsData } = useAdminData(() =>
    adminApi.getPayments({ limit: 4 }),
  );
  const { data: chartsData } = useAdminData(() => adminApi.getChartData());

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const recentApprovals = approvalsData?.profiles ?? [];
  const recentPayments = paymentsData?.payments ?? [];

  const revenueData = chartsData?.revenue ?? [];
  const newUsersData = chartsData?.newUsers ?? [];
  const courseStatData = chartsData?.courseStatus ?? [];
  const starDistData = chartsData?.starDist ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-base-content mb-1">
          Tổng quan hệ thống
        </h2>
        <p className="text-sm text-base-content/50">
          Dữ liệu realtime từ toàn bộ nền tảng
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiUsers}
          label="Tổng người dùng"
          value={stats.totalUsers.toLocaleString()}
          sub={`${stats.totalTutors} gia sư · ${stats.totalStudents} học viên`}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={FiBookOpen}
          label="Khoá học"
          value={stats.totalCourses.toLocaleString()}
          sub={`${stats.activeCourses} đang hoạt động`}
          color="text-info"
          bg="bg-info/10"
        />
        <StatCard
          icon={FiDollarSign}
          label="Doanh thu"
          value={fmtUsd(stats.totalRevenue)}
          sub={`${fmtUsd(stats.pendingPayouts)} chờ chi`}
          color="text-success"
          bg="bg-success/10"
        />
        <StatCard
          icon={FiStar}
          label="Đánh giá TB"
          value={stats.avgRating.toFixed(1)}
          sub={`${stats.totalReviews.toLocaleString()} lượt`}
          color="text-warning"
          bg="bg-warning/10"
        />
      </div>

      {/* ── Pending approvals alert ──────────────────────────── */}
      {stats.pendingApprovals > 0 && (
        <div
          className="alert alert-warning shadow-sm rounded-2xl cursor-pointer"
          onClick={() => onNavigate("approvals")}
        >
          <FiAlertCircle size={18} />
          <span className="text-sm font-medium">
            Có <strong>{stats.pendingApprovals}</strong> hồ sơ gia sư đang chờ
            duyệt.
            <span className="underline ml-1">Xem ngay →</span>
          </span>
        </div>
      )}

      {/* ── Charts row 1: Revenue (full width) ──────────────── */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-base-content mb-1 flex items-center gap-2">
          <FiDollarSign size={14} className="text-indigo-500" />
          Doanh thu theo tháng
        </h3>
        <p className="text-xs text-base-content/40 mb-4">
          12 tháng gần nhất (USD)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={revenueData}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.revenue} stopOpacity={0.25} />
                <stop offset="95%" stopColor={C.revenue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.08}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={<ChartTip fmt={(v) => `$${v.toLocaleString()}`} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Doanh thu"
              stroke={C.revenue}
              strokeWidth={2}
              fill="url(#revGrad)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Charts row 2: New users + Course status ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New users bar chart */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-base-content mb-1 flex items-center gap-2">
            <FiUsers size={14} className="text-cyan-400" />
            Người dùng mới theo tháng
          </h3>
          <p className="text-xs text-base-content/40 mb-4">
            Gia sư & học viên đăng ký mới
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={newUsersData}
              barGap={2}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTip />} />
              <Bar
                dataKey="students"
                name="Học viên"
                fill={C.users}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
              <Bar
                dataKey="tutors"
                name="Gia sư"
                fill={C.revenue}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Mini legend */}
          <div className="flex gap-4 mt-2 justify-center">
            {[
              { color: C.users, label: "Học viên" },
              { color: C.revenue, label: "Gia sư" },
            ].map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1.5 text-xs text-base-content/60"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: l.color }}
                />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Course status donut */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-base-content mb-1 flex items-center gap-2">
            <FiBookOpen size={14} className="text-green-500" />
            Phân bổ trạng thái khoá học
          </h3>
          <p className="text-xs text-base-content/40 mb-2">
            Tổng số khoá học theo trạng thái
          </p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie
                  data={courseStatData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={72}
                  labelLine={false}
                  label={<PieSliceLabel />}
                >
                  {courseStatData.map((_, i) => (
                    <Cell key={i} fill={C.courses[i % C.courses.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-1.5 flex-1">
              {courseStatData.map((d, i) => (
                <li
                  key={d.name}
                  className="flex items-center gap-2 text-xs text-base-content/70"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: C.courses[i % C.courses.length] }}
                  />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="font-semibold text-base-content">
                    {d.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Charts row 3: Star distribution ─────────────────── */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-base-content mb-1 flex items-center gap-2">
          <FiStar size={14} className="text-amber-400" />
          Phân bổ đánh giá sao
        </h3>
        <p className="text-xs text-base-content/40 mb-4">
          Số lượng đánh giá theo số sao
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart
            data={starDistData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              strokeOpacity={0.08}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="star"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={24}
            />
            <Tooltip content={<ChartTip fmt={(v) => `${v} đánh giá`} />} />
            <Bar
              dataKey="count"
              name="Đánh giá"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
            >
              {starDistData.map((_, i) => (
                <Cell key={i} fill={C.stars} fillOpacity={0.4 + i * 0.15} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Recent lists ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent approvals */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-base-content mb-4 flex items-center gap-2">
            <FiCheckCircle size={15} className="text-warning" /> Hồ sơ chờ duyệt
            gần đây
          </h3>
          <div className="space-y-3">
            {recentApprovals.length === 0 && (
              <p className="text-xs text-base-content/40 text-center py-4">
                Không có hồ sơ nào
              </p>
            )}
            {recentApprovals.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <img
                  src={a.user.avatar || avatar(a.user.name)}
                  className="w-8 h-8 rounded-full object-cover"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content truncate">
                    {a.user.name}
                  </p>
                  <p className="text-xs text-base-content/50">
                    {a.subjects?.[0] ?? "—"}
                  </p>
                </div>
                <span
                  className={`badge ${TUTOR_STATUS[a.status]?.badge} badge-sm`}
                >
                  {TUTOR_STATUS[a.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-base-content mb-4 flex items-center gap-2">
            <FiCreditCard size={15} className="text-success" /> Giao dịch gần
            đây
          </h3>
          <div className="space-y-3">
            {recentPayments.length === 0 && (
              <p className="text-xs text-base-content/40 text-center py-4">
                Chưa có giao dịch
              </p>
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
}
