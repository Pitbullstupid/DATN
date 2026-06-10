import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FaDollarSign,
  FaLock,
  FaArrowTrendUp,
  FaXmark,
  FaCheck,
  FaPlus,
  FaTrash,
  FaPen,
  FaBuildingColumns,
  FaStar,
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

// ─── BankAccountForm Modal ────────────────────────────────────
const BankAccountForm = ({ initial, onClose, onSaved }) => {
  const [form, setForm] = useState({
    bankName: initial?.bankName ?? "",
    accountNumber: initial?.accountNumber ?? "",
    accountHolder: initial?.accountHolder ?? "",
    branch: initial?.branch ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.bankName.trim()) e.bankName = "Vui lòng nhập tên ngân hàng";
    if (!form.accountNumber.trim())
      e.accountNumber = "Vui lòng nhập số tài khoản";
    if (!form.accountHolder.trim())
      e.accountHolder = "Vui lòng nhập tên chủ tài khoản";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (initial?.id) {
        await paymentApi.updateBankAccount(initial.id, form);
        toast.success("Đã cập nhật tài khoản ngân hàng");
      } else {
        await paymentApi.createBankAccount(form);
        toast.success("Đã thêm tài khoản ngân hàng");
      }
      onSaved();
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="font-bold text-lg">
            {initial?.id ? "Chỉnh sửa tài khoản" : "Thêm tài khoản ngân hàng"}
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Tên ngân hàng */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Tên ngân hàng <span className="text-error">*</span>
            </label>
            <input
              className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.bankName ? "input-error" : ""}`}
              placeholder="VD: Vietcombank, Techcombank, MB Bank..."
              value={form.bankName}
              onChange={(e) => {
                set("bankName", e.target.value);
                setErrors((er) => ({ ...er, bankName: "" }));
              }}
            />
            {errors.bankName && (
              <p className="text-error text-xs mt-1">{errors.bankName}</p>
            )}
          </div>

          {/* Số tài khoản */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Số tài khoản <span className="text-error">*</span>
            </label>
            <input
              className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.accountNumber ? "input-error" : ""}`}
              placeholder="VD: 0123456789"
              value={form.accountNumber}
              onChange={(e) => {
                set("accountNumber", e.target.value);
                setErrors((er) => ({ ...er, accountNumber: "" }));
              }}
            />
            {errors.accountNumber && (
              <p className="text-error text-xs mt-1">{errors.accountNumber}</p>
            )}
          </div>

          {/* Tên chủ tài khoản */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Tên chủ tài khoản <span className="text-error">*</span>
            </label>
            <input
              className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.accountHolder ? "input-error" : ""}`}
              placeholder="VD: NGUYEN VAN A"
              value={form.accountHolder}
              onChange={(e) => {
                set("accountHolder", e.target.value);
                setErrors((er) => ({ ...er, accountHolder: "" }));
              }}
            />
            {errors.accountHolder && (
              <p className="text-error text-xs mt-1">{errors.accountHolder}</p>
            )}
          </div>

          {/* Chi nhánh (tuỳ chọn) */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Chi nhánh{" "}
              <span className="text-base-content/40 font-normal">
                (tuỳ chọn)
              </span>
            </label>
            <input
              className="input input-bordered w-full focus:outline-none focus:border-primary"
              placeholder="VD: Chi nhánh Hà Nội"
              value={form.branch}
              onChange={(e) => set("branch", e.target.value)}
            />
          </div>

          {/* Đặt làm mặc định */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
            />
            <span className="text-sm">Đặt làm tài khoản mặc định</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Huỷ
          </button>
          <button
            className="btn btn-primary flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaCheck size={12} />
            )}
            {initial?.id ? "Lưu thay đổi" : "Thêm tài khoản"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

// ─── WithdrawModal ────────────────────────────────────────────
const WithdrawModal = ({ balance, bankAccounts, onClose, onSuccess }) => {
  const { t } = useTranslation("payments");
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts.find((b) => b.isDefault)?.id ?? bankAccounts[0]?.id ?? "",
  );
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
    if (!bankAccountId) {
      setError("Vui lòng chọn tài khoản ngân hàng");
      return;
    }

    setLoading(true);
    try {
      await paymentApi.requestWithdrawal(val, bankAccountId);
      toast.success(t("wallet.toast.withdrawSent"));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-md p-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="font-bold text-lg">{t("wallet.modal.title")}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Số dư */}
          <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-base-content/60">
              {t("wallet.available")}
            </span>
            <span className="font-bold text-success">
              ${balance.toFixed(2)} USD
            </span>
          </div>

          {/* Chọn tài khoản ngân hàng */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Tài khoản nhận tiền <span className="text-error">*</span>
            </label>
            {bankAccounts.length === 0 ? (
              <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 text-sm text-warning">
                Bạn chưa có tài khoản ngân hàng. Vui lòng thêm tài khoản trước
                khi rút tiền.
              </div>
            ) : (
              <div className="space-y-2">
                {bankAccounts.map((b) => (
                  <label
                    key={b.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      bankAccountId === b.id
                        ? "border-primary bg-primary/5"
                        : "border-base-300 hover:border-base-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bankAccountId"
                      className="radio radio-primary radio-sm"
                      checked={bankAccountId === b.id}
                      onChange={() => setBankAccountId(b.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm">
                          {b.bankName}
                        </span>
                        {b.isDefault && (
                          <span className="badge badge-primary badge-xs gap-0.5">
                            <FaStar size={8} /> Mặc định
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-base-content/60 mt-0.5">
                        {b.accountNumber} · {b.accountHolder}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Số tiền */}
          <div>
            <label className="text-sm font-medium text-base-content mb-1 block">
              {t("wallet.modal.amountLabel")}{" "}
              <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 font-semibold">
                $
              </span>
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
                className={`input input-bordered w-full pl-7 focus:outline-none focus:border-primary ${error ? "input-error" : ""}`}
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

          {/* Thông tin ngân hàng đã chọn */}
          {selectedBank && (
            <div className="bg-base-200/60 rounded-xl px-4 py-3 text-xs space-y-1 text-base-content/70">
              <div className="flex justify-between">
                <span className="text-base-content/40">Ngân hàng</span>
                <span className="font-medium">{selectedBank.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/40">Số tài khoản</span>
                <span className="font-medium font-mono">
                  {selectedBank.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/40">Chủ tài khoản</span>
                <span className="font-medium">
                  {selectedBank.accountHolder}
                </span>
              </div>
              {selectedBank.branch && (
                <div className="flex justify-between">
                  <span className="text-base-content/40">Chi nhánh</span>
                  <span className="font-medium">{selectedBank.branch}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-base-200/60 rounded-xl px-4 py-3 text-xs text-base-content/50 space-y-1">
            <p>- {t("wallet.modal.ruleProcessing")}</p>
            <p>- {t("wallet.modal.ruleMinimum")}</p>
            <p>- {t("wallet.modal.ruleBank")}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {t("wallet.modal.cancel")}
          </button>
          <button
            className="btn btn-primary flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading || bankAccounts.length === 0}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaCheck size={12} />
            )}
            {t("wallet.modal.confirm")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────
export default function TutorWalletPage() {
  const { t, i18n } = useTranslation("payments");
  const dateLocale = getDateLocale(i18n.language);

  const [wallet, setWallet] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [bankForm, setBankForm] = useState(null); // null | {} | {id,...}
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const [walletRes, bankRes] = await Promise.all([
        paymentApi.getMyWallet(),
        paymentApi.getBankAccounts(),
      ]);
      setWallet(walletRes.data?.data?.wallet);
      setPayments(walletRes.data?.data?.releasedPayments || []);
      setBankAccounts(bankRes.data?.data?.accounts || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchWallet, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const handler = () => fetchWallet();
    window.addEventListener("new-notification", handler);
    return () => window.removeEventListener("new-notification", handler);
  }, []);

  const handleDeleteBank = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentApi.deleteBankAccount(deleteTarget.id);
      toast.success("Đã xoá tài khoản ngân hàng");
      setBankAccounts((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const balance = wallet?.balance ?? 0;
  const held = wallet?.heldAmount ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Modals */}
      {showWithdraw && (
        <WithdrawModal
          balance={balance}
          bankAccounts={bankAccounts}
          onClose={() => setShowWithdraw(false)}
          onSuccess={fetchWallet}
        />
      )}
      {bankForm !== null && (
        <BankAccountForm
          initial={bankForm}
          onClose={() => setBankForm(null)}
          onSaved={fetchWallet}
        />
      )}
      {deleteTarget && (
        <dialog open className="modal modal-bottom sm:modal-middle">
          <div className="modal-box max-w-sm rounded-2xl">
            <h3 className="font-bold text-lg mb-2">Xoá tài khoản ngân hàng?</h3>
            <p className="text-sm text-base-content/60 mb-5">
              Tài khoản{" "}
              <span className="font-semibold">
                {deleteTarget.bankName} – {deleteTarget.accountNumber}
              </span>{" "}
              sẽ bị xoá vĩnh viễn.
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Huỷ
              </button>
              <button
                className="btn btn-error flex-1"
                onClick={handleDeleteBank}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Xoá"
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
        </dialog>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Tiêu đề */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-base-content">
            {t("wallet.title")}
          </h1>
          <p className="text-base-content/50 text-sm mt-1">
            {t("wallet.subtitle")}
          </p>
        </div>

        {/* Stats cards */}
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
            <div
              key={key}
              className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-base-content/50">{label}</p>
                  {loading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                  ) : (
                    <p className={`text-2xl font-bold mt-1 ${color}`}>
                      ${value.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-base-content/30 mt-0.5">USD</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center`}
                >
                  <Icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA rút tiền */}
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

        {/* ── Tài khoản ngân hàng ── */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base-content">
                Tài khoản ngân hàng
              </h2>
              <p className="text-xs text-base-content/40 mt-0.5">
                Quản lý tài khoản nhận tiền khi rút
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm gap-1.5"
              onClick={() => setBankForm({})}
            >
              <FaPlus size={11} /> Thêm
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : bankAccounts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-base-content/30 gap-2">
              <FaBuildingColumns size={28} className="opacity-30" />
              <p className="text-sm">Chưa có tài khoản ngân hàng nào</p>
              <button
                className="btn btn-ghost btn-sm gap-1 mt-1"
                onClick={() => setBankForm({})}
              >
                <FaPlus size={11} /> Thêm tài khoản
              </button>
            </div>
          ) : (
            <div className="divide-y divide-base-200">
              {bankAccounts.map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FaBuildingColumns size={16} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {b.bankName}
                      </span>
                      {b.isDefault && (
                        <span className="badge badge-primary badge-xs gap-0.5">
                          <FaStar size={8} /> Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/60 mt-0.5 font-mono">
                      {b.accountNumber}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {b.accountHolder}
                      {b.branch ? ` · ${b.branch}` : ""}
                    </p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    {!b.isDefault && (
                      <button
                        className="btn btn-ghost btn-xs text-base-content/40"
                        title="Đặt làm mặc định"
                        onClick={() =>
                          paymentApi
                            .updateBankAccount(b.id, { isDefault: true })
                            .then(fetchWallet)
                        }
                      >
                        <FaStar size={12} />
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-xs text-base-content/40"
                      title="Chỉnh sửa"
                      onClick={() => setBankForm(b)}
                    >
                      <FaPen size={12} />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error/60 hover:text-error"
                      title="Xoá"
                      onClick={() => setDeleteTarget(b)}
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Released payments */}
        {payments.length > 0 && (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-base-200">
              <h2 className="font-bold text-base-content">
                {t("wallet.releasedTitle")}
              </h2>
              <p className="text-xs text-base-content/40 mt-0.5">
                {t("wallet.releasedSubtitle")}
              </p>
            </div>
            <div className="divide-y divide-base-200">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm text-base-content">
                      {p.courseClass?.subject}
                    </p>
                    <p className="text-xs text-base-content/40">
                      {fmtDate(p.releasedAt, dateLocale)}
                    </p>
                  </div>
                  <span className="font-bold text-success">
                    +${p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdrawal history */}
        {wallet?.withdrawals?.length > 0 && (
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-base-200">
              <h2 className="font-bold text-base-content">
                {t("wallet.withdrawHistory")}
              </h2>
            </div>
            <div className="divide-y divide-base-200">
              {wallet.withdrawals.map((w) => {
                const badge = STATUS_BADGE[w.status] ?? "badge-ghost";
                const label = t(`wallet.status.${w.status}`, {
                  defaultValue: w.status,
                });
                // Lấy thông tin ngân hàng từ snapshot
                const bank = w.bankSnapshot;
                return (
                  <div key={w.id} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-base-content">
                          ${w.amount.toFixed(2)} USD
                        </p>
                        <p className="text-xs text-base-content/40">
                          {fmtDate(w.requestedAt, dateLocale)}
                        </p>
                      </div>
                      <span className={`badge ${badge} badge-sm`}>{label}</span>
                    </div>
                    {bank && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-base-content/50">
                        <FaBuildingColumns size={10} className="shrink-0" />
                        <span>
                          {bank.bankName} · {bank.accountNumber} ·{" "}
                          {bank.accountHolder}
                        </span>
                      </div>
                    )}
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
