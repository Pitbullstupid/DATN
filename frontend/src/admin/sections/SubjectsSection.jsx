import { useState, useEffect, useRef, useCallback } from "react";
import {
  FiBook,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiSearch,
  FiToggleLeft,
  FiToggleRight,
  FiBell,
} from "react-icons/fi";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox } from "../shared";

// ─── Inline editable row ─────────────────────────────────────
function SubjectRow({ subject, onSave, onDelete, onToggle, busy }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = () => {
    if (!name.trim() || name.trim() === subject.name) {
      setEditing(false);
      return;
    }
    onSave(subject.id, name.trim(), () => setEditing(false));
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setName(subject.name);
      setEditing(false);
    }
  };

  return (
    <tr
      className={`hover transition-opacity ${!subject.isActive ? "opacity-50" : ""}`}
    >
      {/* Tên — chiếm hết phần còn lại */}
      <td>
        {editing ? (
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKey}
            className="input input-sm input-bordered w-full max-w-xs"
          />
        ) : (
          <span className="font-medium text-sm text-base-content">
            {subject.name}
          </span>
        )}
      </td>

      {/* Trạng thái — cố định, không wrap */}
      <td className="w-28 whitespace-nowrap">
        <span
          className={`badge badge-sm ${subject.isActive ? "badge-success" : "badge-ghost"}`}
        >
          {subject.isActive ? "Đang dùng" : "Đã ẩn"}
        </span>
      </td>

      {/* Thao tác — cố định, không wrap, căn phải */}
      <td className="w-32 whitespace-nowrap text-right">
        <div className="inline-flex items-center gap-1">
          {editing ? (
            <>
              <button
                className="btn btn-xs btn-success btn-circle"
                onClick={handleSave}
                disabled={busy}
                title="Lưu"
              >
                <FiCheck size={12} />
              </button>
              <button
                className="btn btn-xs btn-ghost btn-circle"
                onClick={() => {
                  setName(subject.name);
                  setEditing(false);
                }}
                title="Huỷ"
              >
                <FiX size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-xs btn-ghost btn-circle"
                title={subject.isActive ? "Ẩn môn học" : "Hiện lại"}
                onClick={() => onToggle(subject)}
                disabled={busy}
              >
                {subject.isActive ? (
                  <FiToggleRight size={14} className="text-success" />
                ) : (
                  <FiToggleLeft size={14} className="text-base-content/40" />
                )}
              </button>
              <button
                className="btn btn-xs btn-ghost btn-circle"
                title="Đổi tên"
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                <FiEdit2 size={12} className="text-primary" />
              </button>
              <button
                className="btn btn-xs btn-ghost btn-circle"
                title="Xoá"
                onClick={() => onDelete(subject)}
                disabled={busy}
              >
                <FiTrash2 size={12} className="text-error" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main section ────────────────────────────────────────────
export default function SubjectsSection() {
  const [search, setSearch] = useState("");
  const [searchInput, setInput] = useState("");
  const [showInactive, setShowAll] = useState(false);
  const [newName, setNewName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState(null); // id đang xử lý
  const [toast, setToast] = useState(null); // { type, msg }
  const [lastRefetch, setLastRefetch] = useState(null); // thời gian refetch cuối (từ notif)
  const addInputRef = useRef(null);

  const { data, loading, error, reload } = useAdminData(
    () => adminApi.getSubjects(showInactive ? {} : { isActive: true }),
    [search, showInactive],
  );

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Auto-focus input khi mở form thêm ──
  useEffect(() => {
    if (addOpen) addInputRef.current?.focus();
  }, [addOpen]);

  // ── Lắng nghe notification → auto refetch ──────────────────
  // Kết nối SSE endpoint /api/notifications/stream (nếu backend dùng SSE)
  // hoặc fallback dùng BroadcastChannel (same-tab communication)
  useEffect(() => {
    // BroadcastChannel: khi các section khác / tab khác phát "subjects_changed"
    let bc;
    try {
      bc = new BroadcastChannel("admin_notifications");
      bc.onmessage = (e) => {
        // Nhận bất kỳ thông báo nào liên quan đến subjects
        if (
          e.data?.type === "subjects_changed" ||
          e.data?.type === "TUTOR_PROFILE_SUBMITTED"
        ) {
          setLastRefetch(new Date());
          reload();
        }
      };
    } catch (_) {
      /* browser không hỗ trợ BroadcastChannel */
    }

    // SSE stream (nếu backend expose /api/notifications/stream)
    let evtSource;
    try {
      const token = localStorage.getItem("token");
      evtSource = new EventSource(
        `${import.meta.env.VITE_API_URL || "http://localhost:5001/api"}/notifications/stream?token=${token}`,
      );
      evtSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          // Refetch khi có bất kỳ notif admin mới
          if (payload?.type && payload.userId === "admin") {
            setLastRefetch(new Date());
            reload();
          }
        } catch (_) {}
      };
      evtSource.onerror = () => evtSource.close();
    } catch (_) {}

    return () => {
      bc?.close();
      evtSource?.close();
    };
  }, [reload]);

  // ── Helpers ──────────────────────────────────────────────────
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const subjects = (data?.subjects ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Thêm mới ─────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setBusyId("new");
    try {
      await adminApi.createSubject({ name: newName.trim() });
      setNewName("");
      setAddOpen(false);
      reload();
      showToast("success", `Đã thêm môn "${newName.trim()}"`);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Đổi tên ──────────────────────────────────────────────────
  const handleSave = async (id, name, done) => {
    setBusyId(id);
    try {
      await adminApi.updateSubject(id, { name });
      reload();
      showToast("success", "Đã cập nhật tên môn học");
      done?.();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Toggle isActive ───────────────────────────────────────────
  const handleToggle = async (subject) => {
    setBusyId(subject.id);
    try {
      await adminApi.updateSubject(subject.id, { isActive: !subject.isActive });
      reload();
      showToast(
        "success",
        subject.isActive ? "Đã ẩn môn học" : "Đã hiện lại môn học",
      );
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Xoá ──────────────────────────────────────────────────────
  const handleDelete = async (subject) => {
    if (
      !confirm(
        `Xoá môn học "${subject.name}"?\nDữ liệu lịch sử gia sư sẽ không bị ảnh hưởng.`,
      )
    )
      return;
    setBusyId(subject.id);
    try {
      await adminApi.deleteSubject(subject.id);
      reload();
      showToast("success", `Đã xoá môn "${subject.name}"`);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Môn học</h2>
          <p className="text-sm text-base-content/50">
            {subjects.length} môn học
            {lastRefetch && (
              <span className="ml-2 inline-flex items-center gap-1 text-info text-xs">
                <FiBell size={10} />
                Cập nhật lúc {lastRefetch.toLocaleTimeString("vi-VN")}
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={() => {
            setAddOpen(true);
          }}
        >
          <FiPlus size={14} /> Thêm môn học
        </button>
      </div>

      {/* Form thêm mới */}
      {addOpen && (
        <div className="bg-base-100 border border-primary/30 rounded-2xl p-4 shadow-sm flex gap-2 items-center">
          <FiBook size={16} className="text-primary shrink-0" />
          <input
            ref={addInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setNewName("");
                setAddOpen(false);
              }
            }}
            placeholder="Tên môn học mới…"
            className="input input-bordered input-sm flex-1"
            maxLength={80}
          />
          <button
            className="btn btn-sm btn-primary gap-1"
            onClick={handleAdd}
            disabled={!newName.trim() || busyId === "new"}
          >
            {busyId === "new" ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FiCheck size={13} />
            )}
            Lưu
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setNewName("");
              setAddOpen(false);
            }}
          >
            <FiX size={13} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[200px]">
          <FiSearch size={14} className="text-base-content/40" />
          <input
            value={searchInput}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tìm môn học…"
            className="grow"
          />
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-base-content/60">Hiện môn đã ẩn</span>
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-primary"
            checked={showInactive}
            onChange={(e) => setShowAll(e.target.checked)}
          />
        </label>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      {/* Table */}
      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead className="bg-base-200/60">
                <tr>
                  <th>Tên môn học</th>
                  <th className="w-28">Trạng thái</th>
                  <th className="w-32 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <SubjectRow
                    key={s.id}
                    subject={s}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                    busy={busyId === s.id}
                  />
                ))}
              </tbody>
            </table>
            {subjects.length === 0 && (
              <div className="flex flex-col items-center py-12 text-base-content/30 gap-2">
                <FiBook size={32} className="opacity-30" />
                <p className="text-sm">Không có môn học nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-end z-50`} onClick={() => setToast(null)}>
          <div
            className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"} shadow-lg text-sm cursor-pointer`}
          >
            {toast.type === "success" ? (
              <FiCheck size={14} />
            ) : (
              <FiX size={14} />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
