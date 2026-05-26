import { useState } from "react";
import { FiBookOpen } from "react-icons/fi";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox, Pagination } from "../shared";
import { COURSE_STATUS, fmtDate, fmtUsd } from "../shared/statusMaps";

export default function CoursesSection() {
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState("");

  const { data, loading, error, reload } = useAdminData(
    () => adminApi.getCourses({ page, limit: 15, status: statusFilter || undefined }),
    [page, statusFilter],
  );

  const courses    = data?.courses ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-base-content">Khoá học</h2>
          <p className="text-sm text-base-content/50">
            {pagination?.total?.toLocaleString() ?? "—"} khoá học
          </p>
        </div>
        <select
          className="select select-bordered select-sm"
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING_PAYMENT">Chờ thanh toán</option>
          <option value="UPCOMING">Sắp tới</option>
          <option value="ONGOING">Đang học</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã huỷ</option>
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
                  <th>Môn học</th>
                  <th>Gia sư</th>
                  <th>Học viên</th>
                  <th>Trạng thái</th>
                  <th>Tiến độ</th>
                  <th>Học phí</th>
                  <th>Bắt đầu</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => {
                  const pct =
                    c.totalSessions > 0
                      ? Math.round((c.sessionsDone / c.totalSessions) * 100)
                      : 0;
                  const st = COURSE_STATUS[c.status] ?? COURSE_STATUS.UPCOMING;
                  return (
                    <tr key={c.id} className="hover">
                      <td className="font-medium text-sm">{c.subject}</td>
                      <td>
                        <span className="flex items-center gap-1.5 text-sm">
                          <FaChalkboardTeacher size={12} className="text-primary shrink-0" />
                          {c.tutorProfile.user.name}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-sm">
                          <FaUserGraduate size={12} className="text-info shrink-0" />
                          {c.student.name}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${st.badge} badge-sm`}>{st.label}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 bg-base-300 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-base-content/50 shrink-0">{pct}%</span>
                        </div>
                      </td>
                      <td className="text-success font-semibold text-sm">
                        {c.totalPrice ? fmtUsd(c.totalPrice) : "—"}
                      </td>
                      <td className="text-sm text-base-content/60">{fmtDate(c.startDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {courses.length === 0 && (
              <div className="flex flex-col items-center py-12 text-base-content/30 gap-2">
                <FiBookOpen size={32} className="opacity-30" />
                <p className="text-sm">Không có khoá học nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Pagination pagination={pagination} onChange={setPage} />
    </div>
  );
}