import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FaDollarSign,
  FaLock,
  FaArrowTrendUp,
  FaXmark,
  FaCheck,
} from "react-icons/fa6";
import { paymentApi } from "../api/paymentApi";
import { getDateLocale } from "../i18n/dateLocale";

const STATUS_BADGE = {
  PENDING: "badge-warning",
  PROCESSING: "badge-info",
  COMPLETED: "badge-success",
  FAILED: "badge-error",
};

const fmtDate = (iso, locale) =>
  iso
    ? new Date(iso).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-base-300 ${className}`} />
);

const WithdrawModal = ({ balance, onClose, onSuccess }) => {
  const { t } = useTranslation("payments");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError(t("wallet.errors.validAmount"));
      return;
    }
    if (val > balance) {
      setError(t("wallet.errors.insufficient", { amount: balance.toFixed(2) }));
      return;
    }
    if (val < 10) {
      setError(t("wallet.errors.minimum"));
      return;
    }

    setLoading(true);
    try {
      await paymentApi.requestWithdrawal(val);
      toast.success(t("wallet.toast.withdrawSent"));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-md p-0 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="font-bold text-lg">{t("wallet.modal.title")}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-base-content/60">{t("wallet.available")}</span>
            <span className="font-bold text-success">${balance.toFixed(2)} USD</span>
          </div>

          <div>
            <label className="text-sm font-medium text-base-content mb-1 block">
              {t("wallet.modal.amountLabel")} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 font-semibold">$</span>
              <input
                type="number"
                min={10}
                max={balance}
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0.00"
                className={`input input-bordered w-full pl-7 focus:outline-none focus:border-primary ${
                  error ? "input-error" : ""
                }`}
              />
            </div>
            {error && <p className="text-error text-xs mt-1">{error}</p>}
            <div className="flex gap-2 mt-2">
              {[25, 50, 100].map((pct) => {
                const val = ((balance * pct) / 100).toFixed(2);
                return (
                  <button
                    key={pct}
                    className="btn btn-xs btn-ghost border border-base-300"
                    onClick={() => {
                      setAmount(val);
                      setError("");
                    }}
                  >
                    {pct}% (${val})
                  </button>
                );
              })}
              <button
                className="btn btn-xs btn-ghost border border-base-300"
                onClick={() => {
                  setAmount(balance.toFixed(2));
                  setError("");
                }}
              >
                {t("wallet.modal.all")}
              </button>
            </div>
          </div>

          <div className="bg-base-200/60 rounded-xl px-4 py-3 text-xs text-base-content/50 space-y-1">
            <p>- {t("wallet.modal.ruleProcessing")}</p>
            <p>- {t("wallet.modal.ruleMinimum")}</p>
            <p>- {t("wallet.modal.ruleBank")}</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
            {t("wallet.modal.cancel")}
          </button>
          <button className="btn btn-primary flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : <FaCheck size={12} />}
            {t("wallet.modal.confirm")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

export default function TutorWalletPage() {
  const { t, i18n } = useTranslation("payments");
  const dateLocale = getDateLocale(i18n.language);
  const [wallet, setWallet] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getMyWallet();
      setWallet(res.data?.data?.wallet);
      setPayments(res.data?.data?.releasedPayments || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWallet();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const balance = wallet?.balance ?? 0;
  const held = wallet?.heldAmount ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;

  return (
    <div className="min-h-screen bg-base-200">
      {showWithdraw && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={fetchWallet}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-base-content">{t("wallet.title")}</h1>
          <p className="text-base-content/50 text-sm mt-1">{t("wallet.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: FaDollarSign,
              label: t("wallet.available"),
              value: balance,
              color: "text-success",
              bg: "bg-success/10",
              key: "balance",
            },
            {
              icon: FaLock,
              label: t("wallet.held"),
              value: held,
              color: "text-warning",
              bg: "bg-warning/10",
              key: "held",
            },
            {
              icon: FaArrowTrendUp,
              label: t("wallet.totalEarned"),
              value: totalEarned,
              color: "text-primary",
              bg: "bg-primary/10",
              key: "total",
            },
          ].map(({ icon: Icon, label, value, color, bg, key }) => (
            <div key={key} className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-base-content/50">{label}</p>
                  {loading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className={`text-2xl font-bold mt-1 ${color}`}>${value.toFixed(2)}</p>
                  )}
                  <p className="text-xs text-base-content/30 mt-0.5">USD</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary w-full gap-2"
          disabled={balance < 10 || loading}
          onClick={() => setShowWithdraw(true)}
        >
          <FaDollarSign size={14} />
          {balance < 10
            ? t("wallet.needMin", { amount: balance.toFixed(2) })
            : t("wallet.withdrawCta", { amount: balance.toFixed(2) })}
        </button>

        {held > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-sm text-warning flex items-start gap-2">
            <FaLock size={13} className="shrink-0 mt-0.5" />
            <span>{t("wallet.heldInfo", { amount: held.toFixed(2) })}</span>
          </div>
        )}

        {payments.length > 0 && (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-base-200">
              <h2 className="font-bold text-base-content">{t("wallet.releasedTitle")}</h2>
              <p className="text-xs text-base-content/40 mt-0.5">{t("wallet.releasedSubtitle")}</p>
            </div>
            <div className="divide-y divide-base-200">
              {payments.map((p) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-base-content">{p.courseClass?.subject}</p>
                    <p className="text-xs text-base-content/40">{fmtDate(p.releasedAt, dateLocale)}</p>
                  </div>
                  <span className="font-bold text-success">+${p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {wallet?.withdrawals?.length > 0 && (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-base-200">
              <h2 className="font-bold text-base-content">{t("wallet.withdrawHistory")}</h2>
            </div>
            <div className="divide-y divide-base-200">
              {wallet.withdrawals.map((w) => {
                const badge = STATUS_BADGE[w.status] ?? "badge-ghost";
                const label = t(`wallet.status.${w.status}`, { defaultValue: w.status });
                return (
                  <div key={w.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-base-content">${w.amount.toFixed(2)} USD</p>
                      <p className="text-xs text-base-content/40">{fmtDate(w.requestedAt, dateLocale)}</p>
                    </div>
                    <span className={`badge ${badge} badge-sm`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
