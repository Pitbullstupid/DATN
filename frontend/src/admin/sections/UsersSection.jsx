import { useState, useEffect } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, Pagination } from "../shared";
import { TUTOR_STATUS, fmtDate, avatar } from "../shared/statusMaps";

export default function UsersSection() {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole]               = useState("");
  const [suspending, setSuspending]   = useState(null);

  const { data, loading, error, reload } = useAdminData(
    () => adminApi.getUsers({ page, limit: 20, role, search }),
    [page, role, search],
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSuspend = async (user) => {
    setSuspending(user.id);
    try {
      await adminApi.toggleSuspendUser(user.id);
      reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setSuspending(null);
    }
  };

  const users      = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Người dùng</h2>
          <p className="text-sm text-base-content/50">
            {pagination?.total?.toLocaleString() ?? "—"} tài khoản
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-[200px]">
          <FiSearch size={14} className="text-base-content/40" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên hoặc email…"
            className="grow"
          />
        </label>
        <select
          className="select select-bordered select-sm"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="STUDENT">Học viên</option>
          <option value="TUTOR">Gia sư</option>
        </select>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}

      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead className="bg-base-200/60">
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Trạng thái gia sư</th>
                  <th>Ngày tham gia</th>
                  <th>Khoá học</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const tutorStatus = u.tutorProfile?.status;
                  const isSuspended = tutorStatus === "SUSPENDED";
                  return (
                    <tr key={u.id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || avatar(u.name)}
                            className="w-8 h-8 rounded-full object-cover"
                            alt=""
                          />
                          <div>
                            <p className="font-medium text-sm text-base-content">{u.name}</p>
                            <p className="text-xs text-base-content/50">{u.email}</p>
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
                        {tutorStatus ? (
                          <span className={`badge ${TUTOR_STATUS[tutorStatus]?.badge} badge-sm`}>
                            {TUTOR_STATUS[tutorStatus]?.label}
                          </span>
                        ) : (
                          <span className="text-xs text-base-content/30">—</span>
                        )}
                      </td>
                      <td className="text-sm text-base-content/60">{fmtDate(u.createdAt)}</td>
                      <td className="text-sm font-medium">{u._count?.enrolledCourses ?? 0}</td>
                      <td>
                        {u.role === "TUTOR" && (
                          <div className="dropdown dropdown-end">
                            <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
                              <FiMoreVertical size={14} />
                            </button>
                            <ul
                              tabIndex={0}
                              className="dropdown-content menu p-1 shadow bg-base-100 rounded-xl border border-base-200 w-36 text-xs z-10"
                            >
                              <li>
                                <button
                                  onClick={() => handleSuspend(u)}
                                  disabled={suspending === u.id}
                                  className={isSuspended ? "text-success" : "text-error"}
                                >
                                  {suspending === u.id ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : isSuspended ? (
                                    "Mở khoá"
                                  ) : (
                                    "Tạm khoá"
                                  )}
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="flex flex-col items-center py-12 text-base-content/30 gap-2">
                <FiSearch size={32} className="opacity-30" />
                <p className="text-sm">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Pagination pagination={pagination} onChange={setPage} />
    </div>
  );
}