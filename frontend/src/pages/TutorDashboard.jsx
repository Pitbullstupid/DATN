import React, { useEffect, useState } from "react";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiDollarSign,
  FiTrendingUp,
  FiInbox,
  FiLayers,
  FiCheckCircle,
  FiCreditCard,
  FiStar,
  FiCalendar,
  FiEdit2,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import { getMyProfile } from "../api/tutorApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ── Stat cards — chỉ dùng DaisyUI semantic colors ─────────────
const statCards = [
  {
    label: "Total Payment",
    value: "$0.00",
    sub: "USD",
    icon: FiDollarSign,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Total Boost Created",
    value: "0",
    sub: "boosts",
    icon: FiTrendingUp,
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    label: "Hiring Request",
    value: "0",
    sub: "pending",
    icon: FiInbox,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    label: "Total Session",
    value: "0",
    sub: "sessions",
    icon: FiLayers,
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    label: "Recent Tuition",
    value: "0",
    sub: "recent",
    icon: FiCheckCircle,
    color: "text-error",
    bg: "bg-error/10",
  },
  {
    label: "Total Ticket",
    value: "0",
    sub: "tickets",
    icon: FiCreditCard,
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const STATUS_MAP = {
  PENDING:    { label: "Incomplete",  cls: "badge-warning" },
  INCOMPLETE: { label: "In Progress", cls: "badge-info"    },
  REVIEWING:  { label: "Under Review",cls: "badge-warning" },
  APPROVED:   { label: "Approved",    cls: "badge-success" },
  REJECTED:   { label: "Rejected",    cls: "badge-error"   },
  SUSPENDED:  { label: "Suspended",   cls: "badge-error"   },
};

const INFO_ROWS = [
  { icon: FiCalendar, label: "Join Date",    key: "joinDate" },
  { icon: FiMail,     label: "Email",        key: "email"    },
  { icon: FiPhone,    label: "Mobile",       key: "phone"    },
  { icon: FiMapPin,   label: "Address",      key: "address"  },
];

// ── Skeleton ──────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-base-300 ${className}`} />
);

// ═════════════════════════════════════════════════════════════
const TutorDashboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await getMyProfile();
        if (alive) setProfile(data?.data?.profile ?? null);
      } catch {
        if (alive) setError("Could not load tutor profile.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const name    = profile?.user?.name  || user?.name  || "Tutor";
  const email   = profile?.user?.email || user?.email || "—";
  const avatar  = profile?.user?.avatar|| user?.avatar|| "";
  const phone   = profile?.phone   || "Not updated";
  const address = profile?.address || "Not updated";
  const rating  = profile?.rating       ?? 0;
  const reviews = profile?.totalReviews ?? 0;
  const status  = profile?.status       ?? "PENDING";
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.PENDING;

  const infoValues = { joinDate, email, phone, address };

  return (
    <div className="min-h-screen bg-base-200">

      {/* ── Hero banner ─────────────────────────────────────────
          Không dùng negative margin.
          Content card nằm trong padding-top của section bên dưới.
      ───────────────────────────────────────────────────────── */}
      <div className="relative bg-primary">
        {/* Decorative blobs — dùng primary-content để tự đổi theo theme */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-primary-content/5" />
          <div className="absolute top-4 right-36 w-36 h-36 rounded-full bg-primary-content/5" />
          <div className="absolute -bottom-10 left-16 w-52 h-52 rounded-full bg-primary-content/5" />
        </div>

        {/* Text content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-12 md:py-16 gap-1">
          <p className="text-primary-content/60 text-xs font-semibold uppercase tracking-[0.2em]">
            Tutor Portal
          </p>
          <h1 className="text-primary-content text-3xl md:text-4xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT — Profile card ─────────────────────────── */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">

              {/* Accent strip
              <div className="h-1.5 w-full bg-primary" /> */}

              {/* Avatar + name */}
              <div className="p-6 flex flex-col items-center text-center">
                {loading ? (
                  <Skeleton className="w-20 h-20 rounded-full" />
                ) : avatar ? (
                  <div className="relative">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
                    />
                    {status === "APPROVED" && (
                      <span className="absolute bottom-0 right-0 w-5 h-5 bg-success rounded-full border-2 border-base-100 flex items-center justify-center">
                        <FiCheckCircle size={10} className="text-success-content" />
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full ring-4 ring-primary/20 bg-primary/10 flex items-center justify-center text-primary">
                    <FiUser size={30} />
                  </div>
                )}

                {loading ? (
                  <div className="mt-4 space-y-2 w-full">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                ) : (
                  <>
                    <h2 className="mt-4 text-lg font-bold text-base-content">{name}</h2>
                    <p className="text-base-content/40 text-xs mt-0.5">
                      @{name.toLowerCase().replace(/\s+/g, "")}
                    </p>
                    <span className={`badge badge-sm mt-2 ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </>
                )}

                {/* Rating */}
                {!loading && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <FiStar className="text-warning" size={14} />
                    <span className="text-sm font-semibold text-base-content">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-base-content/40">
                      ({reviews} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Info rows */}
              <div className="border-t border-base-200 divide-y divide-base-200 text-sm">
                {INFO_ROWS.map(({ icon: Icon, label, key }) => (
                  <div key={label} className="flex items-start gap-3 px-5 py-3">
                    <Icon size={15} className="text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base-content/40 text-xs">{label}</p>
                      {loading ? (
                        <Skeleton className="h-3 w-28 mt-1" />
                      ) : (
                        <p className="text-base-content font-medium truncate">
                          {infoValues[key]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit button */}
              <div className="p-4">
                <button
                  onClick={() => navigate("/tutor/profile/edit")}
                  className="btn btn-primary  btn-sm w-full gap-2"
                >
                  <FiEdit2 size={14} />
                  Edit Profile
                  {/* <FiChevronRight size={14} className="" /> */}
                </button>
              </div>
            </div>

            {/* Incomplete profile warning */}
            {!loading && status !== "APPROVED" && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex gap-3 text-sm">
                <FiAlertCircle className="text-warning shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-semibold text-base-content">Profile Incomplete</p>
                  <p className="text-base-content/60 text-xs mt-0.5">
                    Complete your profile to get approved and start receiving students.
                  </p>
                  <button
                    onClick={() => navigate("/tutor/profile/edit")}
                    className="btn btn-warning btn-xs mt-2"
                  >
                    Complete Now
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* ── RIGHT — Stats + Table ─────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">

            {error && (
              <div className="alert alert-error rounded-2xl shadow-sm">
                <FiAlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base-content/50 text-xs font-medium truncate">
                          {card.label}
                        </p>
                        {loading ? (
                          <Skeleton className="h-6 w-12 mt-1" />
                        ) : (
                          <p className="text-base-content text-2xl font-bold mt-1 leading-none">
                            {card.value}
                          </p>
                        )}
                        <p className="text-base-content/30 text-xs mt-1">{card.sub}</p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hiring Request table */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-base-200">
                <div>
                  <h3 className="text-base-content font-bold">Hiring Request Message</h3>
                  <p className="text-base-content/40 text-xs mt-0.5">
                    Students who sent a hiring request
                  </p>
                </div>
                <span className="badge badge-primary badge-outline badge-sm">0 new</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-base-200 text-base-content/50 text-xs uppercase tracking-wider">
                      {["Name", "Email", "Subject", "Message", "Action"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 font-semibold whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2 text-base-content/30">
                          <FiInbox size={32} />
                          <span className="text-sm">No requests found</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;