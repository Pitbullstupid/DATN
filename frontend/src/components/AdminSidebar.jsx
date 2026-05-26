import {
  FiHome, FiUsers, FiBookOpen, FiCreditCard, FiStar,
  FiCheckCircle, FiMenu, FiX, FiSettings, FiLogOut,
} from "react-icons/fi";

export const buildNavItems = (pendingCount) => [
  { key: "dashboard", label: "Tổng quan",    icon: FiHome },
  { key: "users",     label: "Người dùng",   icon: FiUsers },
  { key: "approvals", label: "Duyệt gia sư", icon: FiCheckCircle, badge: pendingCount },
  { key: "courses",   label: "Khoá học",     icon: FiBookOpen },
  { key: "payments",  label: "Thanh toán",   icon: FiCreditCard },
  { key: "reviews",   label: "Đánh giá",     icon: FiStar },
];

export default function AdminSidebar({ collapsed, setCollapsed, activeSection, setActiveSection, pendingCount }) {
  const NAV_ITEMS = buildNavItems(pendingCount);

  return (
    <aside
      className={`bg-base-100 border-r border-base-200 flex flex-col transition-all duration-300 shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
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
            {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
            {!collapsed && badge > 0 && (
              <span
                className={`badge badge-sm ${
                  activeSection === key ? "badge-ghost" : "badge-error"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
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
  );
}