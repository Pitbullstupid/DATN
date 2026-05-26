import { useEffect } from "react";
import {
  FiX,
  FiMail,
  FiUser,
  FiCalendar,
  FiBook,
  FiStar,
  FiDollarSign,
  FiExternalLink,
  FiClock,
  FiAward,
  FiPhone,
  FiMapPin,
  FiGlobe,
} from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { adminApi } from "../../api/adminApi";
import { useAdminData } from "../../hook/useAdminData";
import { Spinner, ErrorBox } from "../shared";
import { TUTOR_STATUS, fmtDate, fmtUsd, avatar } from "../shared/statusMaps";

const DAY_MAP = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  0: "CN",
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "CN",
};

const TIMING_LABEL = {
  MORNING: "Buổi sáng",
  AFTERNOON: "Buổi chiều",
  EVENING: "Buổi tối",
  FLEXIBLE: "Linh hoạt",
};

const STYLE_LABEL = {
  ONE_ON_ONE: "1 kèm 1",
  GROUP: "Nhóm",
  BOTH: "Cả 2 hình thức",
};

const GENDER_LABEL = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const Section = ({ title, icon: Icon, children }) => (
  <div className="space-y-3">
    <h4 className="flex items-center gap-2 text-sm font-semibold text-base-content border-b border-base-200 pb-2">
      <Icon size={14} className="text-primary" /> {title}
    </h4>
    {children}
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  const displayValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <div className="flex items-start gap-2 rounded-xl bg-base-200/40 p-3">
      <Icon size={14} className="text-primary mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-base-content/40">{label}</p>
        <p className="text-sm text-base-content/75 break-words">{displayValue}</p>
      </div>
    </div>
  );
};

const getSocialLinks = (socialMedia) => {
  if (!socialMedia) return [];
  if (Array.isArray(socialMedia)) {
    return socialMedia
      .filter((item) => item?.url)
      .map((item) => ({
        id: item.id ?? `${item.platform}-${item.url}`,
        label: item.platform,
        url: item.url,
      }));
  }

  return ["facebook", "twitter", "youtube", "instagram"]
    .filter((platform) => socialMedia[platform])
    .map((platform) => ({
      id: platform,
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      url: socialMedia[platform],
    }));
};

export default function TutorDetailModal({ tutorProfileId, onClose }) {
  const { data, loading, error, reload } = useAdminData(
    () => adminApi.getTutorDetail(tutorProfileId),
    [tutorProfileId],
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const profile = data?.profile;
  const socialLinks = getSocialLinks(profile?.socialMedia);
  const courseCount = profile?._count?.courses ?? profile?._count?.courseClasses ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 shrink-0">
          <div className="flex items-center gap-2">
            <FaChalkboardTeacher size={16} className="text-primary" />
            <span className="font-bold text-base-content text-sm">Chi tiết hồ sơ gia sư</span>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} onRetry={reload} />}

          {profile && (
            <>
              <div className="flex items-start gap-4">
                <img
                  src={profile.user?.avatar || avatar(profile.user?.name)}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-base-200 shrink-0"
                  alt={profile.user?.name || "Gia sư"}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg text-base-content">
                      {profile.user?.name || "Gia sư"}
                    </p>
                    <span className={`badge ${TUTOR_STATUS[profile.status]?.badge} badge-sm`}>
                      {TUTOR_STATUS[profile.status]?.label ?? profile.status}
                    </span>
                  </div>
                  <p className="text-sm text-base-content/50 flex items-center gap-1 mt-0.5">
                    <FiMail size={12} /> {profile.user?.email || "Chưa có email"}
                  </p>
                  <p className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
                    <FiCalendar size={11} /> Tham gia: {fmtDate(profile.user?.createdAt)}
                    {profile.user?.gender && (
                      <>
                        <span className="mx-1">·</span>
                        <FiUser size={11} />
                        {GENDER_LABEL[profile.user.gender] ?? profile.user.gender}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Đánh giá TB",
                    value: profile.rating ? `${profile.rating.toFixed(1)} ★` : "—",
                    color: "text-warning",
                  },
                  {
                    label: "Tổng đánh giá",
                    value: profile.totalReviews ?? 0,
                    color: "text-base-content",
                  },
                  {
                    label: "Số khóa học",
                    value: courseCount,
                    color: "text-info",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-base-200/50 rounded-2xl p-3 text-center">
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-base-content/40 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <Section title="Thông tin cơ bản" icon={FiUser}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailRow icon={FiPhone} label="Số điện thoại" value={profile.phone} />
                  <DetailRow icon={FiMapPin} label="Địa chỉ" value={profile.address} />
                  <DetailRow icon={FiGlobe} label="Quốc gia" value={profile.country} />
                  <DetailRow icon={FiBook} label="Ngôn ngữ dạy" value={profile.languages} />
                </div>
              </Section>

              {profile.bio && (
                <Section title="Giới thiệu bản thân" icon={FiUser}>
                  <p className="text-sm text-base-content/70 leading-relaxed bg-base-200/40 rounded-xl p-3">
                    {profile.bio}
                  </p>
                </Section>
              )}

              <Section title="Môn học & Học phí" icon={FiBook}>
                <div className="flex flex-wrap gap-2">
                  {(profile.subjects ?? []).map((subject) => (
                    <span key={subject} className="badge badge-primary badge-outline text-xs">
                      {subject}
                    </span>
                  ))}
                  {(!profile.subjects || profile.subjects.length === 0) && (
                    <span className="text-xs text-base-content/30">Chưa điền</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <DetailRow
                    icon={FiDollarSign}
                    label="Học phí mỗi giờ"
                    value={
                      profile.pricePerHour != null
                        ? `${fmtUsd(profile.pricePerHour)} / giờ`
                        : null
                    }
                  />
                  <DetailRow
                    icon={FiClock}
                    label="Số buổi mỗi tuần"
                    value={profile.daysPerWeek}
                  />
                  <DetailRow
                    icon={FiClock}
                    label="Ca học"
                    value={TIMING_LABEL[profile.timingShift] ?? profile.timingShift}
                  />
                  <DetailRow
                    icon={FaChalkboardTeacher}
                    label="Hình thức dạy"
                    value={STYLE_LABEL[profile.tutoringStyle] ?? profile.tutoringStyle}
                  />
                  <DetailRow
                    icon={FiAward}
                    label="Kinh nghiệm"
                    value={
                      profile.experience != null ? `${profile.experience} năm` : null
                    }
                  />
                  <DetailRow
                    icon={FiClock}
                    label="Thời lượng buổi học"
                    value={
                      profile.tuitionDuration != null
                        ? `${profile.tuitionDuration} giờ`
                        : null
                    }
                  />
                  <DetailRow
                    icon={FiMapPin}
                    label="Khu vực ưu tiên"
                    value={profile.preferredAreas}
                  />
                </div>
              </Section>

              {(profile.qualification || profile.certificate) && (
                <Section title="Bằng cấp & Chứng chỉ" icon={FiAward}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailRow
                      icon={FiAward}
                      label="Trình độ"
                      value={profile.qualification}
                    />
                    <DetailRow
                      icon={FiExternalLink}
                      label="Chứng chỉ"
                      value={profile.certificate}
                    />
                  </div>
                </Section>
              )}

              {profile.educations?.length > 0 && (
                <Section title="Học vấn" icon={FiAward}>
                  <div className="space-y-2">
                    {profile.educations.map((edu) => (
                      <div key={edu.id} className="bg-base-200/40 rounded-xl p-3">
                        <p className="text-sm font-semibold text-base-content">
                          {edu.universityName}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {edu.fieldOfStudy}
                          {edu.result ? ` · Kết quả: ${edu.result}` : ""}
                          {edu.passingYear ? ` · Năm tốt nghiệp: ${edu.passingYear}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {profile.schedules?.length > 0 && (
                <Section title="Lịch rảnh" icon={FiClock}>
                  <div className="flex flex-wrap gap-2">
                    {profile.schedules.map((schedule) => (
                      <span key={schedule.id} className="badge badge-outline text-xs gap-1">
                        {DAY_MAP[schedule.dayOfWeek] ?? schedule.dayOfWeek}
                        {schedule.startTime && ` ${schedule.startTime}-${schedule.endTime}`}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {socialLinks.length > 0 && (
                <Section title="Mạng xã hội" icon={FiExternalLink}>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-outline gap-1"
                      >
                        <FiExternalLink size={10} /> {link.label}
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {profile.wallet && (
                <Section title="Ví gia sư" icon={FiDollarSign}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-success/10 rounded-xl p-3">
                      <p className="text-xs text-base-content/40">Số dư khả dụng</p>
                      <p className="text-lg font-bold text-success">
                        {fmtUsd(profile.wallet.balance)}
                      </p>
                    </div>
                    <div className="bg-warning/10 rounded-xl p-3">
                      <p className="text-xs text-base-content/40">Đang giữ</p>
                      <p className="text-lg font-bold text-warning">
                        {fmtUsd(profile.wallet.heldAmount)}
                      </p>
                    </div>
                    <div className="bg-info/10 rounded-xl p-3">
                      <p className="text-xs text-base-content/40">Tổng đã kiếm</p>
                      <p className="text-lg font-bold text-info">
                        {fmtUsd(profile.wallet.totalEarned)}
                      </p>
                    </div>
                  </div>
                </Section>
              )}

              {profile.reviews?.length > 0 && (
                <Section title="Đánh giá gần đây" icon={FiStar}>
                  <div className="space-y-3">
                    {profile.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-base-200/40 rounded-xl p-3 flex gap-3"
                      >
                        <img
                          src={review.student?.avatar || avatar(review.student?.name)}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                          alt={review.student?.name || "Học viên"}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold text-base-content">
                              {review.student?.name}
                            </p>
                            <span className="text-warning text-xs">
                              {"★".repeat(review.rating)}
                              {"☆".repeat(5 - review.rating)}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-xs text-base-content/60 italic line-clamp-2">
                              "{review.comment}"
                            </p>
                          )}
                          <p className="text-[10px] text-base-content/30 mt-1">
                            {fmtDate(review.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {profile.adminNote && (
                <div className="alert alert-error rounded-2xl text-sm">
                  <FiX size={15} />
                  <div>
                    <p className="font-semibold text-xs mb-0.5">Lý do từ chối:</p>
                    <p>{profile.adminNote}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
