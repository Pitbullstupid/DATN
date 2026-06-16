import ThemeSelector from "../components/ThemeSelector";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

export default function AdminHeader({ activeNav }) {
  const { user } = useAuth();

  return (
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

      <ThemeSelector />
      <NotificationBell />

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-base-content hidden sm:block">
          {user?.name || "Admin"}
        </span>
      </div>
    </header>
  );
}
