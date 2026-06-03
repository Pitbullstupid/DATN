import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCalendarDays, FaClock, FaInbox } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { getMyCoursesAsStudent, getMyCoursesAsTutor } from "../api/courseApi";

const DAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

const SHIFTS = [
  { key: "morning", label: "Sáng", start: 5, end: 12 },
  { key: "afternoon", label: "Chiều", start: 12, end: 18 },
  { key: "evening", label: "Tối", start: 18, end: 24 },
];

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "UPCOMING", "ONGOING"];

const STATUS_LABEL = {
  PENDING_PAYMENT: "Chờ thanh toán",
  UPCOMING: "Sắp tới",
  ONGOING: "Đang học",
};

const getHour = (time) => Number(time?.split(":")?.[0] ?? 0);

const getShiftKey = (time) => {
  const hour = getHour(time);
  return SHIFTS.find((shift) => hour >= shift.start && hour < shift.end)?.key;
};

const sortSlots = (a, b) => a.startTime.localeCompare(b.startTime);

const ScheduleSkeleton = () => (
  <div className="overflow-x-auto border border-base-300 bg-base-100">
    <div className="min-w-245">
      <div className="grid grid-cols-[120px_repeat(7,minmax(120px,1fr))] border-b border-base-300">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-12 border-r border-base-300 p-3">
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, row) => (
        <div
          key={row}
          className="grid min-h-48 grid-cols-[120px_repeat(7,minmax(120px,1fr))] border-b border-base-300"
        >
          {Array.from({ length: 8 }).map((_, col) => (
            <div key={col} className="border-r border-base-300 p-3">
              {col > 0 && col < 4 && <div className="skeleton h-28 w-full" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const ScheduleCard = ({ item, isTutor, onClick }) => {
  const person = isTutor ? item.student?.name : item.tutorProfile?.user?.name;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full rounded-md border border-info/60 bg-base-100 p-2.5 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-info hover:shadow-md"
    >
      <div className="mb-1 pr-12 text-xs text-base-content/70">
        {item.code}
      </div>
      <div className="font-semibold leading-6 text-base-content">
        {item.subject}
      </div>
      <div className="mt-1 text-base-content/75">
        ({item.startTime} - {item.endTime})
      </div>
      {person && (
        <div className="mt-1 font-semibold text-base-content/80">
          {isTutor ? "Học viên" : "Gia sư"}: {person}
        </div>
      )}
      <div className="mt-1 text-base-content/65">
        {STATUS_LABEL[item.status] || item.status}
      </div>
    </button>
  );
};

const Scheduled = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTutor = user?.role === "TUTOR";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      if (!user) {
        if (!ignore) setLoading(false);
        return;
      }

      if (!ignore) setLoading(true);
      try {
        const fetchFn = isTutor ? getMyCoursesAsTutor : getMyCoursesAsStudent;
        const res = await fetchFn({ limit: 200 });
        if (!ignore) setCourses(res.data?.data?.courses || []);
      } catch (err) {
        if (!ignore) toast.error(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [isTutor, user]);

  const scheduleMap = useMemo(() => {
    const map = {};

    SHIFTS.forEach((shift) => {
      map[shift.key] = {};
      DAYS.forEach((day) => {
        map[shift.key][day.value] = [];
      });
    });

    courses
      .filter((course) => ACTIVE_STATUSES.includes(course.status))
      .forEach((course) => {
        course.schedules?.forEach((slot) => {
          const shiftKey = getShiftKey(slot.startTime);
          if (!shiftKey) return;

          map[shiftKey][slot.dayOfWeek]?.push({
            ...slot,
            courseId: course.id,
            code: course.id.slice(0, 12).toUpperCase(),
            subject: course.subject,
            status: course.status,
            student: course.student,
            tutorProfile: course.tutorProfile,
          });
        });
      });

    Object.values(map).forEach((days) => {
      Object.values(days).forEach((items) => items.sort(sortSlots));
    });

    return map;
  }, [courses]);

  const totalSlots = useMemo(
    () =>
      Object.values(scheduleMap).reduce(
        (sum, days) =>
          sum +
          Object.values(days).reduce((daySum, items) => daySum + items.length, 0),
        0,
      ),
    [scheduleMap],
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-base-200 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-base-300 bg-base-100 p-8 text-center">
          <FaCalendarDays className="mx-auto mb-4 text-4xl text-primary" />
          <h1 className="text-2xl font-bold">Lịch học</h1>
          <p className="mt-2 text-base-content/60">
            Vui lòng đăng nhập để xem thời khóa biểu của bạn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              {isTutor ? "Lịch dạy của tôi" : "Lịch học của tôi"}
            </h1>
            <p className="mt-1 text-sm text-base-content/55">
              {isTutor
                ? "Theo dõi môn học và giờ dạy theo từng ngày trong tuần."
                : "Theo dõi môn học và giờ học theo từng ngày trong tuần."}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-base-300 bg-base-100 px-4 py-2 text-sm text-base-content/70">
            <FaClock className="text-primary" />
            <span>{totalSlots} lịch trong tuần</span>
          </div>
        </div>

        {loading ? (
          <ScheduleSkeleton />
        ) : totalSlots === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-base-300 bg-base-100 text-base-content/45">
            <FaInbox className="text-4xl opacity-40" />
            <p className="font-medium">Chưa có lịch học nào</p>
            {!isTutor && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => navigate("/tutors")}
              >
                Tìm gia sư
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-base-300 bg-base-100 shadow-sm">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[120px_repeat(7,minmax(136px,1fr))] border-b border-base-300">
                <div className="border-r border-base-300 p-3 font-semibold">
                  Thời khóa biểu
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day.value}
                    className="border-r border-base-300 p-3 font-semibold last:border-r-0"
                  >
                    {day.label}
                  </div>
                ))}
              </div>

              {SHIFTS.map((shift) => (
                <div
                  key={shift.key}
                  className="grid min-h-52 grid-cols-[120px_repeat(7,minmax(136px,1fr))] border-b border-base-300 last:border-b-0"
                >
                  <div className="border-r border-base-300 p-3 text-base-content/80">
                    {shift.label}
                  </div>
                  {DAYS.map((day) => (
                    <div
                      key={`${shift.key}-${day.value}`}
                      className="space-y-2 border-r border-base-300 p-3 last:border-r-0"
                    >
                      {scheduleMap[shift.key][day.value].map((item) => (
                        <ScheduleCard
                          key={`${item.courseId}-${item.id}`}
                          item={item}
                          isTutor={isTutor}
                          onClick={() => navigate(`/courses/${item.courseId}`)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduled;
