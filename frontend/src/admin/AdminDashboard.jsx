import { useState } from "react";
import { useAdminData } from "./../hook/useAdminData";
import AdminSidebar, { buildNavItems } from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import DashboardSection from "./sections/DashboardSection";
import UsersSection from "./sections/UsersSection";
import ApprovalsSection from "./sections/ApprovalsSection";
import CoursesSection from "./sections/CoursesSection";
import PaymentsSection from "./sections/PaymentsSection";
import ReviewsSection from "./sections/ReviewsSection";
import SubjectsSection from "./sections/SubjectsSection";
import { adminApi } from "../api/adminApi";

export default function AdminDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const { data: stats } = useAdminData(() => adminApi.getStats());
  const pendingCount = stats?.pendingApprovals ?? 0;

  const NAV_ITEMS = buildNavItems(pendingCount);
  const activeNav = NAV_ITEMS.find((n) => n.key === activeSection);

  const SECTIONS = {
    dashboard: <DashboardSection onNavigate={setActiveSection} />,
    users: <UsersSection />,
    approvals: <ApprovalsSection />,
    courses: <CoursesSection />,
    payments: <PaymentsSection />,
    reviews: <ReviewsSection />,
    subjects: <SubjectsSection />,
  };

  return (
    <div className="min-h-screen bg-base-200 flex">
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        pendingCount={pendingCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader activeNav={activeNav} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">{SECTIONS[activeSection]}</div>
        </main>
      </div>
    </div>
  );
}
