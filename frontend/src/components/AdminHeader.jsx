import ThemeSelector from "../components/ThemeSelector";
import NotificationBell from "../components/NotificationBell";

export default function AdminHeader({ activeNav }) {
  return (
    <header className="bg-base-100 border-b border-base-200 h-16 flex items-center px-6 gap-4 shrink-0">
      <div className="flex items-center gap-2">
        {activeNav?.icon && <activeNav.icon size={18} className="text-primary" />}
        <h1 className="font-semibold text-base-content text-sm">{activeNav?.label}</h1>
      </div>

      <div className="flex-1" />

      <ThemeSelector />
      <NotificationBell />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">A</span>
        </div>
        <span className="text-sm font-medium text-base-content hidden sm:block">Admin</span>
      </div>
    </header>
  );
}