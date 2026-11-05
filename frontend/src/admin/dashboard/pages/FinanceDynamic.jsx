import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CircleDollarSign,
  CreditCard,
  Eye,
  FileText,
  Plus,
  Receipt,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { apiAssetUrl, apiGet, apiPatch, apiPost } from "../../../api";

const money = (minor = 0) =>
  `Rs ${(Number(minor) / 100).toLocaleString("en-PK")}`;
const monthName = (date) =>
  date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "-";
  const invoiceMonthNumber = (invoice) =>
    Number(
      invoice.sequenceNumber ||
        invoice.description?.match(/Month\s+(\d+)/i)?.[1] ||
        0,
    );
const titleFor = (path) =>
  path.includes("invoices")
    ? "Invoices & vouchers"
    : path.includes("collect")
      ? "Collect fee / payments"
      : path.includes("defaulters")
        ? "Defaulters list"
        : path.includes("scholarships")
          ? "Scholarships & concessions"
          : "Fee overview";
const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
const currentPayableInvoices = (items) =>
  Object.values(
    items
      .filter((invoice) => invoice.outstandingMinor > 0)
      .reduce((groups, invoice) => {
        const key = invoice.studentId || invoice.Student?.id;
        const current = groups[key];
        const invoiceSequence =
          invoice.sequenceNumber ||
          Number(invoice.description?.match(/Month (\d+)/)?.[1]) ||
          Number.MAX_SAFE_INTEGER;
        const currentSequence = current
          ? current.sequenceNumber ||
            Number(current.description?.match(/Month (\d+)/)?.[1]) ||
            Number.MAX_SAFE_INTEGER
          : Number.MAX_SAFE_INTEGER;
        if (
          !current ||
          invoiceSequence < currentSequence ||
          (invoiceSequence === currentSequence &&
            invoice.dueDate < current.dueDate)
        )
          groups[key] = invoice;
        return groups;
      }, {}),
  ).map((invoice) => ({
    ...invoice,
    cycleStatus: invoice.paidMinor > 0 ? "PARTIAL" : "PENDING",
  }));
const currentMonthInvoices = (items) => {
  const month = new Date().toISOString().slice(0, 7);
  return items.filter((invoice) =>
    String(invoice.dueDate || "").startsWith(month),
  );
};

function QuickPayment({ invoices, onSaved, onError }) {
  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.outstandingMinor > 0,
  );
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [saving, setSaving] = useState(false);
  const selectedInvoice = unpaidInvoices.find(
    (invoice) => invoice.id === invoiceId,
  );

  useEffect(() => {
    if (!selectedInvoice && unpaidInvoices[0]) {
      setInvoiceId(unpaidInvoices[0].id);
      setAmount(String(unpaidInvoices[0].outstandingMinor / 100));
    }
    if (selectedInvoice && !amount)
      setAmount(String(selectedInvoice.outstandingMinor / 100));
  }, [invoiceId, selectedInvoice, unpaidInvoices]);

  const receivePayment = async (event) => {
    event.preventDefault();
    if (!selectedInvoice) return;
    setSaving(true);
    try {
      const amountMinor = Math.round(Number(amount) * 100);
      if (!amountMinor || amountMinor > selectedInvoice.outstandingMinor)
        throw new Error("Enter an amount up to the outstanding balance");
      await apiPost(
        "/fees/collect",
        { invoiceId: selectedInvoice.id, amountMinor, method },
        { headers: { "Idempotency-Key": `payment-${crypto.randomUUID()}` } },
      );
      setInvoiceId("");
      setAmount("");
      onSaved();
    } catch (requestError) {
      onError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel quick-payment-panel">
      <div>
        <p className="settings-kicker">Receive fee</p>
        <h2>Record a monthly fee payment</h2>
        <p>
          Enter the amount received. Partial payments remain pending until the
          monthly fee is fully paid.
        </p>
      </div>
      <form onSubmit={receivePayment}>
        <label>
          Unpaid invoice
          <select
            value={invoiceId}
            onChange={(event) => {
              const nextInvoice = unpaidInvoices.find(
                (invoice) => invoice.id === event.target.value,
              );
              setInvoiceId(event.target.value);
              setAmount(
                nextInvoice ? String(nextInvoice.outstandingMinor / 100) : "",
              );
            }}
            required
          >
            <option value="">Select unpaid invoice</option>
            {unpaidInvoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber} · {invoice.Student?.name || "Student"} ·{" "}
                {money(invoice.outstandingMinor)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount received (PKR)
          <input
            type="number"
            min="1"
            max={
              selectedInvoice
                ? selectedInvoice.outstandingMinor / 100
                : undefined
            }
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <label>
          Payment method
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CARD">Card</option>
            <option value="ONLINE">Online</option>
          </select>
        </label>
        <button
          className="primary-button"
          type="submit"
          disabled={!selectedInvoice || saving}
        >
          <Check size={15} /> {saving ? "Saving..." : "Save payment"}
        </button>
      </form>
      {!unpaidInvoices.length && (
        <p className="registration-note">No unpaid invoices available.</p>
      )}
    </section>
  );
}

const downloadReceipt = (payment) => {
  const student = payment.Student || {};
  const institute =
    JSON.parse(localStorage.getItem("prime_user") || "null")?.Institute || {};
  const instituteName = "The Prime Institute of Technology";
  const logoUrl = institute.logoUrl
    ? apiAssetUrl(institute.logoUrl)
    : `${window.location.origin}/the-prime-logo.svg`;
  const logo = `<img class="logo" src="${escapeHtml(logoUrl)}" alt="Institute logo">`;
  const watermark = `<div class="watermark"><img src="${escapeHtml(logoUrl)}" alt=""></div>`;
  const paymentDueDate = payment.dueDate || payment.Invoice?.dueDate;
  const invoiceLabel = payment.invoiceNumber || payment.Invoice?.invoiceNumber || payment.invoiceId || "-";
  const feeMonths = payment.feeMonths || (paymentDueDate ? [monthName(paymentDueDate)] : []);
  const receiptInvoiceLabel = feeMonths.length
    ? `${invoiceLabel} · Due: ${feeMonths.join(", ")}`
    : invoiceLabel;
  payment.invoiceNumber = receiptInvoiceLabel;
  payment.amountMinor = payment.receiptAmountMinor || payment.amountMinor;
  const receipt = `<!doctype html><html><head><meta charset="utf-8"><title>Fee Receipt ${escapeHtml(payment.receiptNumber)}</title><style>:root{--navy:#252b68;--gold:#f5ae18;--ink:#1d2540;--muted:#68728a;--line:#dfe3ee}*{box-sizing:border-box}body{font-family:Arial,sans-serif;background:#f4f6fb;color:var(--ink);margin:0;padding:40px}.receipt{position:relative;overflow:hidden;background:#fff;max-width:700px;margin:auto;padding:38px;border:1px solid var(--line);box-shadow:0 18px 45px rgba(37,43,104,.12)}.watermark{position:absolute;inset:190px 0 120px;display:grid;place-items:center;opacity:.045;pointer-events:none}.watermark img{width:360px;height:360px;object-fit:contain}.brand{position:relative;display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:4px solid var(--gold);padding-bottom:22px;margin-bottom:28px}.logo{width:68px;height:68px;object-fit:contain}.brand-copy{display:flex;align-items:center;gap:15px;margin-right:auto}.brand h1{font-size:24px;color:var(--navy);margin:0}.brand p{margin:5px 0 0;color:var(--muted)}.serial{text-align:right}.serial small{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:1px}.serial strong{display:inline-block;background:var(--navy);color:#fff;border-radius:5px;padding:8px 10px;margin-top:5px;font-size:14px}dl{position:relative;display:grid;grid-template-columns:170px 1fr;gap:0;margin:0 0 24px;border:1px solid var(--line);border-radius:8px;overflow:hidden}dt,dd{padding:13px 15px;margin:0;border-bottom:1px solid var(--line)}dt{color:var(--muted);background:#f8f9fc}dd{font-weight:600}dt:last-of-type,dd:last-of-type{border-bottom:0}.total{position:relative;background:var(--navy);color:#fff;border-left:7px solid var(--gold);border-radius:7px;padding:18px 20px;font-size:20px;display:flex;justify-content:space-between;align-items:center}.total strong{color:#ffd36a}.note{position:relative;margin:28px 0 0;color:var(--muted);font-size:12px;line-height:1.6}@media print{body{background:#fff;padding:0}.receipt{border:0;box-shadow:none;max-width:none}}
</style></head><body><main class="receipt">${watermark}<header class="brand"><div class="brand-copy">${logo}<div><h1>${escapeHtml(instituteName)}</h1><p>Official Fee Receipt</p></div></div><div class="serial"><small>Serial number</small><strong>${escapeHtml(payment.receiptNumber)}</strong></div></header><dl><dt>Student</dt><dd>${escapeHtml(student.name || "-")}</dd><dt>Student code</dt><dd>${escapeHtml(student.studentCode || "-")}</dd><dt>Invoice</dt><dd>${escapeHtml(payment.invoiceNumber || payment.invoiceId || "-")}</dd><dt>Payment method</dt><dd>${escapeHtml(payment.method || "-")}</dd><dt>Received on</dt><dd>${escapeHtml(payment.paidAt ? new Date(payment.paidAt).toLocaleString("en-PK") : "-")}</dd><dt>Status</dt><dd>RECEIVED</dd></dl><div class="total"><span>Amount received</span><strong>${escapeHtml(money(payment.amountMinor))}</strong></div><p class="note">Serial number: ${escapeHtml(payment.receiptNumber)}<br>This receipt is system generated and valid without a signature.</p></main><script>window.addEventListener('load',()=>window.print())</script></body></html>`;
  const url = URL.createObjectURL(
    new Blob([receipt], { type: "text/html;charset=utf-8" }),
  );
  const receiptWindow = window.open(url, "_blank");
  if (!receiptWindow) {
    URL.revokeObjectURL(url);
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};

function FinanceDynamic({ item }) {
  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [students, setStudents] = useState([]);
  const [invoiceStudentId, setInvoiceStudentId] = useState("");
  const [invoiceCourseId, setInvoiceCourseId] = useState("");
  const [collectStudentId, setCollectStudentId] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [viewedInvoice, setViewedInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [selectedPaymentMonths, setSelectedPaymentMonths] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isInvoices = item.path.includes("invoices");
  const isCollect = item.path.includes("collect");
  const isDefaulters = item.path.includes("defaulters");
  const isScholarships = item.path.includes("scholarships");
  const isOverview =
    !isInvoices && !isCollect && !isDefaulters && !isScholarships;
  const showInvoiceActions = isInvoices || isOverview;

  const load = () => {
    setLoading(true);
    const endpoint = isInvoices
      ? "/fees/invoices?currentMonthOnly=true&limit=100"
      : isCollect
        ? "/fees/payments?limit=100"
        : isDefaulters
          ? "/fees/defaulters"
          : isScholarships
            ? "/fees/scholarships"
            : "/fees/invoices?currentMonthOnly=true&limit=100";
    Promise.all([
      apiGet("/fees"),
      apiGet(endpoint),
      apiGet("/students?limit=100"),
      apiGet("/fees/invoices?limit=100"),
      apiGet("/fees/payments?limit=100"),
    ])
      .then(([summary, list, studentList, invoiceList, paymentList]) => {
        setOverview(summary.data);
        const monthInvoices = isInvoices
          ? list.data.items || []
          : isOverview
            ? currentMonthInvoices(list.data.items || [])
            : list.data.items || [];
        setRecords(monthInvoices);
        setInvoiceOptions(
          invoiceList.data.items || (isInvoices ? list.data.items || [] : []),
        );
        setStudents(studentList.data.items || []);
        setPayments(paymentList.data.items || []);
        setError("");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setForm(null);
    setViewedInvoice(null);
    setPaymentInvoice(null);
    setEditingPayment(null);
    setSelectedPaymentMonths([]);
    setInvoiceCourseId("");
    setInvoiceStudentId("");
    load();
  }, [item.path]);

  const submit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (invoiceForm) {
        const studentId = data.get("studentId");
        const selectedStudent = students.find(
          (student) => student.id === studentId,
        );
        const hasOutstanding = invoiceOptions.some(
          (invoice) =>
            invoice.studentId === studentId && invoice.outstandingMinor > 0,
        );
        const amount = Number(
          selectedStudent?.Course?.monthlyFeeMinor || data.get("amount"),
        );
        const dueDate = data.get("dueDate") || currentDate;
        if (
          !studentId ||
          !selectedStudent ||
          !invoiceCourseId ||
          selectedStudent.courseId !== invoiceCourseId
        )
          throw new Error("Select a student from the selected course");
        if (!hasOutstanding) throw new Error("This student has no pending fee");
        if (!amount || !dueDate)
          throw new Error("Course fee and due date are required");
        await apiPost("/fees/invoices", {
          studentId,
          amountMinor: amount,
          dueDate,
          description: data.get("description"),
        });
      }
      if (paymentForm)
        await apiPost(
          "/fees/collect",
          {
            invoiceId: data.get("invoiceId"),
            amountMinor: Number(data.get("amount")) * 100,
            method: data.get("method"),
          },
          { headers: { "Idempotency-Key": `payment-${crypto.randomUUID()}` } },
        );
      if (isScholarships)
        await apiPost("/fees/scholarships", {
          studentId: data.get("studentId"),
          type: data.get("type"),
          percentage: data.get("percentage")
            ? Number(data.get("percentage"))
            : undefined,
          amountMinor: data.get("amount")
            ? Number(data.get("amount")) * 100
            : undefined,
          validFrom: data.get("validFrom"),
          validUntil: data.get("validUntil"),
        });
      setForm(null);
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const filtered = records.filter(
    (record) =>
      JSON.stringify(record).toLowerCase().includes(query.toLowerCase()) &&
      (!statusFilter || record.status === statusFilter) &&
      (!courseFilter ||
        record.courseId === courseFilter ||
        record.Student?.courseId === courseFilter ||
        record.Student?.Course?.id === courseFilter),
  );
  const courseOptions = [
    ...new Map(
      students
        .filter((student) => student.Course)
        .map((student) => [student.Course.id, student.Course]),
    ).values(),
  ];
  const action = isInvoices
    ? null
    : isCollect
      ? null
      : isScholarships
        ? "Add concession"
        : null;
  const paymentForm = isCollect || form === "Record payment";
  const invoiceForm = isInvoices && form === "Create invoice";
  const displayForm = isCollect ? "Record payment" : form;
  const openInvoiceStudents = students.filter(
    (student) =>
      student.courseId === invoiceCourseId &&
      invoiceOptions.some(
        (invoice) =>
          invoice.studentId === student.id && invoice.outstandingMinor > 0,
      ),
  );
  const selectedInvoiceCourse =
    students.find((student) => student.id === invoiceStudentId)?.Course ||
    students.find((student) => student.courseId === invoiceCourseId)?.Course;
  const currentDate = new Date().toISOString().slice(0, 10);
  const openPaymentForm = (invoice) => {
    setInvoiceOptions((current) =>
      current.some((item) => item.id === invoice.id)
        ? current
        : [...current, invoice],
    );
    setCollectStudentId(invoice.studentId);
    setSelectedInvoiceId(invoice.id);
    setForm("Record payment");
  };
  const invoicePayments = viewedInvoice
    ? payments.filter(
        (payment) =>
          payment.invoiceId === viewedInvoice.id ||
          payment.Invoice?.id === viewedInvoice.id,
      )
    : [];
  const viewedStudent = viewedInvoice?.Student || {};
  const viewedCourseRecord = viewedInvoice
    ? students.find((entry) => entry.id === viewedInvoice.studentId)?.Course ||
      viewedStudent.Course ||
      {}
    : {};
  const viewedCourse = viewedCourseRecord.name || "-";
  const viewedCourseTotal = Number(
    viewedCourseRecord.totalFeeMinor ||
      Number(viewedCourseRecord.durationMonths || 0) *
        Number(viewedCourseRecord.monthlyFeeMinor || 0),
  );
  const viewedPaidTotal = viewedInvoice
    ? payments
        .filter((payment) => payment.studentId === viewedInvoice.studentId)
        .reduce((total, payment) => total + Number(payment.amountMinor || 0), 0)
    : 0;
  const viewedRemaining = Math.max(viewedCourseTotal - viewedPaidTotal, 0);
  const viewedMonthPaid = invoicePayments.reduce(
    (total, payment) => total + Number(payment.amountMinor || 0),
    0,
  );
  const viewedMonthRemaining = Math.max(
    Number(viewedInvoice?.amountMinor || 0) - viewedMonthPaid,
    0,
  );
  const viewedMonthStatus =
    viewedMonthRemaining <= 0
      ? "Paid"
      : viewedMonthPaid > 0
        ? "Partial"
        : "Pending";
  const viewedStudentPayments = payments.filter(
    (payment) => payment.studentId === viewedInvoice?.studentId,
  );
  const viewedReceiptMonths = [...new Set(
    viewedStudentPayments
      .map((payment) => payment.dueDate || payment.Invoice?.dueDate)
      .filter(Boolean)
      .map((date) => monthName(date)),
  )];
  const viewedReceiptAmount = viewedStudentPayments.reduce(
    (total, payment) => total + Number(payment.amountMinor || 0),
    0,
  );
  const openInvoiceReceipt = (payment) => {
    const studentPayments = payments.filter(
      (item) => item.studentId === viewedInvoice.studentId,
    );
    const feeMonths = [...new Set(
      studentPayments
        .map((item) => item.dueDate || item.Invoice?.dueDate)
        .filter(Boolean)
        .map((date) => monthName(date)),
    )];
    const receiptAmountMinor = studentPayments.reduce(
      (total, item) => total + Number(item.amountMinor || 0),
      0,
    );
    downloadReceipt({
      ...payment,
      invoiceId: viewedInvoice.id,
      invoiceNumber: viewedInvoice.invoiceNumber,
      dueDate: viewedInvoice.dueDate,
      feeMonths,
      receiptAmountMinor,
      courseName: viewedCourse,
      Student: viewedStudent,
    });
  };
  const openInvoicePayment = async (invoice) => {
    try {
      const studentInvoices = await apiGet(
        `/fees/invoices?studentId=${encodeURIComponent(invoice.studentId)}&limit=100`,
      );
      const fetchedInvoices = studentInvoices.data.items || [];
      setInvoiceOptions((current) => {
        const merged = new Map(current.map((item) => [item.id, item]));
        fetchedInvoices.forEach((item) => merged.set(item.id, item));
        return [...merged.values()];
      });
    } catch (requestError) {
      setError(requestError.message);
    }
    setPaymentInvoice(invoice);
    const invoiceOutstanding = Number(invoice.outstandingMinor || 0);
    setSelectedPaymentMonths(invoiceOutstanding > 0 ? [invoice.id] : []);
    setPaymentAmounts({
      [invoice.id]: invoiceOutstanding,
    });
    setPaymentMethod("CASH");
  };
  const openInvoiceView = async (invoice) => {
    try {
      const studentInvoices = await apiGet(
        `/fees/invoices?studentId=${encodeURIComponent(invoice.studentId)}&limit=100`,
      );
      const fetchedInvoices = studentInvoices.data.items || [];
      setInvoiceOptions((current) => {
        const merged = new Map(current.map((item) => [item.id, item]));
        fetchedInvoices.forEach((item) => merged.set(item.id, item));
        return [...merged.values()];
      });
    } catch (requestError) {
      setError(requestError.message);
    }
    setViewedInvoice(invoice);
  };
  const updateInvoicePaymentStatus = (invoice, event) => {
    if (event.target.value === "PAID") openInvoicePayment(invoice);
  };
  const editInvoiceVoucher = (invoice) => {
    openInvoicePayment(invoice);
  };
  const saveInvoicePayment = async (event) => {
    event.preventDefault();
    const selectedInvoices = invoiceOptions.filter(
      (invoice) =>
        selectedPaymentMonths.includes(invoice.id) &&
        Number(paymentAmounts[invoice.id] || 0) > 0,
    );
    const selectedAmount = selectedInvoices.reduce(
      (total, invoice) => total + Number(paymentAmounts[invoice.id] || 0),
      0,
    );
    if (
      !paymentInvoice ||
      !selectedAmount ||
      selectedInvoices.some(
        (invoice) => Number(paymentAmounts[invoice.id]) > Number(invoice.outstandingMinor || 0),
      ) ||
      !selectedInvoices.length
    ) {
      setError(
        "Select months and enter an amount up to each month's remaining balance",
      );
      return;
    }
    setPaymentSaving(true);
    try {
      for (const invoice of selectedInvoices) {
        const invoiceAmount = Number(paymentAmounts[invoice.id]);
        await apiPost(
          "/fees/collect",
          {
            invoiceId: invoice.id,
            amountMinor: invoiceAmount,
            method: paymentMethod,
          },
          { headers: { "Idempotency-Key": `payment-${crypto.randomUUID()}` } },
        );
      }
      setPaymentInvoice(null);
      setPaymentAmounts({});
      setSelectedPaymentMonths([]);
      load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPaymentSaving(false);
    }
  };
  const saveEditedPayment = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await apiPatch(`/fees/payments/${editingPayment.id}`, {
        amountMinor: Math.round(Number(data.get("amount")) * 100),
        method: data.get("method"),
        paidAt: data.get("paidAt"),
      });
      setEditingPayment(null);
      load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const paymentMonthOptions = paymentInvoice
    ? invoiceOptions
        .filter((invoice) => {
          const course =
            students.find((student) => student.id === paymentInvoice.studentId)
              ?.Course ||
            paymentInvoice.Student?.Course ||
            {};
          const courseDuration = Number(course.durationMonths || 0);
          return (
            invoice.studentId === paymentInvoice.studentId &&
            (!courseDuration ||
              (invoiceMonthNumber(invoice) > 0 &&
                invoiceMonthNumber(invoice) <= courseDuration))
          );
        })
        .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
    : [];
  const viewedSessionInvoices = viewedInvoice
    ? invoiceOptions
        .filter((invoice) => {
          const course =
            students.find((student) => student.id === viewedInvoice.studentId)
              ?.Course ||
            viewedInvoice.Student?.Course ||
            {};
          const courseDuration = Number(course.durationMonths || 0);
          return (
            invoice.studentId === viewedInvoice.studentId &&
            (!courseDuration ||
              (invoiceMonthNumber(invoice) > 0 &&
                invoiceMonthNumber(invoice) <= courseDuration))
          );
        })
        .sort((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))
    : [];
  const viewedSessionRows = viewedSessionInvoices.map((invoice) => {
    const paidMinor = payments
      .filter(
        (payment) =>
          payment.invoiceId === invoice.id ||
          payment.Invoice?.id === invoice.id,
      )
      .reduce((total, payment) => total + Number(payment.amountMinor || 0), 0);
    const remainingMinor = Math.max(
      Number(invoice.amountMinor || 0) - paidMinor,
      0,
    );
    return {
      ...invoice,
      paidMinor,
      remainingMinor,
      status: remainingMinor <= 0 ? "Paid" : paidMinor > 0 ? "Partial" : "Unpaid",
    };
  });
  const paidPaymentMonths = paymentMonthOptions.filter(
    (invoice) => Number(invoice.outstandingMinor || 0) <= 0,
  );
  const remainingPaymentMonths = paymentMonthOptions.filter(
    (invoice) => Number(invoice.outstandingMinor || 0) > 0,
  );
  const selectedPaymentBalance = paymentMonthOptions
    .filter((invoice) => selectedPaymentMonths.includes(invoice.id))
    .reduce((total, invoice) => total + Number(paymentAmounts[invoice.id] || 0), 0);
  const paymentInvoicePayments = paymentInvoice
    ? payments.filter(
        (payment) =>
          payment.invoiceId === paymentInvoice.id ||
          payment.Invoice?.id === paymentInvoice.id,
      )
    : [];
  const groupedPaymentHistory = Object.values(
    paymentInvoicePayments.reduce((groups, payment) => {
      const key = payment.method || "UNKNOWN";
      if (!groups[key]) groups[key] = { ...payment, amountMinor: 0, paymentCount: 0 };
      groups[key].amountMinor += Number(payment.amountMinor || 0);
      groups[key].paymentCount += 1;
      return groups;
    }, {}),
  );
  return (
    <>
      {editingPayment && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal invoice-details-modal payment-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-payment-title">
            <div className="modal-heading"><div><p className="settings-kicker">Correct payment</p><h2 id="edit-payment-title">Edit fee payment</h2><p>{editingPayment.receiptNumber || editingPayment.id}</p></div><button className="icon-button" type="button" onClick={() => setEditingPayment(null)} aria-label="Close edit payment"><X size={17} /></button></div>
            <form className="invoice-payment-form" onSubmit={saveEditedPayment}><label>Amount received (PKR)<input name="amount" type="number" min="1" step="0.01" defaultValue={Number(editingPayment.amountMinor || 0) / 100} required /></label><label>Payment date<input name="paidAt" type="date" defaultValue={editingPayment.paidAt ? String(editingPayment.paidAt).slice(0, 10) : currentDate} required /></label><label>Payment method<select name="method" defaultValue={editingPayment.method || "CASH"}><option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CARD">Card</option><option value="ONLINE">Online</option></select></label><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setEditingPayment(null)}>Cancel</button><button className="primary-button" type="submit">Save correction</button></div></form>
          </section>
        </div>
      )}
      {paymentInvoice && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPaymentInvoice(null);
          }}
        >
          <section
            className="modal invoice-details-modal fee-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-payment-title"
          >
            <div className="modal-heading">
              <div>
                <p className="settings-kicker">Receive fee</p>
                <h2 id="invoice-payment-title">
                  {paymentInvoice.invoiceNumber}
                </h2>
                <p>
                  {paymentInvoice.Student?.name || paymentInvoice.studentId} ·{" "}
                  {paymentInvoice.Student?.Course?.name || "-"} ·{" "}
                  {monthName(paymentInvoice.dueDate)}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setPaymentInvoice(null)}
                aria-label="Close payment form"
              >
                <X size={17} />
              </button>
            </div>
            <div className="invoice-detail-summary">
              <span>
                <small>Monthly fee</small>
                <strong>{money(paymentInvoice.amountMinor)}</strong>
              </span>
              <span>
                <small>Paid so far</small>
                <strong>{money(paymentInvoice.paidMinor)}</strong>
              </span>
              <span>
                <small>Remaining</small>
                <strong>
                  {money(
                    Math.max(
                      Number(paymentInvoice.amountMinor || 0) -
                        Number(paymentInvoice.paidMinor || 0),
                      0,
                    ),
                  )}
                </strong>
              </span>
            </div>
            <div className="payment-month-picker">
              <div className="payment-month-picker-heading">
                <strong>Select fee months</strong>
                <span>
                  <b className="payment-month-legend paid">Paid</b>
                  <b className="payment-month-legend remaining">Remaining</b>
                </span>
              </div>
              <div className="payment-month-list">
                {paymentMonthOptions.map((invoice) => {
                  const monthComplete = Number(invoice.outstandingMinor || 0) <= 0;
                  return (
                  <label className={monthComplete ? "payment-month-complete" : "payment-month-remaining"} key={invoice.id}>
                    <input
                      type="checkbox"
                      checked={selectedPaymentMonths.includes(invoice.id)}
                      disabled={monthComplete}
                      onChange={(event) =>
                        setSelectedPaymentMonths((current) => {
                          if (event.target.checked) {
                            setPaymentAmounts((amounts) => ({
                              ...amounts,
                              [invoice.id]: Number(invoice.outstandingMinor || 0),
                            }));
                            return [...current, invoice.id];
                          }
                          setPaymentAmounts((amounts) => {
                            const next = { ...amounts };
                            delete next[invoice.id];
                            return next;
                          });
                          return current.filter((id) => id !== invoice.id);
                        })
                      }
                    />
                    <span>{monthName(invoice.dueDate)}</span>
                    <small className="payment-month-balance">
                      Fee {money(invoice.amountMinor)}
                      {monthComplete
                        ? ` · Paid ${money(invoice.paidMinor || invoice.amountMinor)}`
                        : ` · Remaining ${money(invoice.outstandingMinor)}`}
                    </small>
                    {monthComplete ? (
                      <b className="payment-complete-mark"><Check size={13} /> Paid</b>
                    ) : (
                      <b className="payment-remaining-mark">Remaining</b>
                    )}
                    {!monthComplete && String(invoice.dueDate || "") > currentDate && <small className="advance-fee-label">Advance fee</small>}
                    <input
                      className="payment-month-amount"
                      type="number"
                      min="0"
                      max={Number(invoice.outstandingMinor || 0) / 100}
                      step="0.01"
                      placeholder="Amount"
                      value={paymentAmounts[invoice.id] ? Number(paymentAmounts[invoice.id]) / 100 : ""}
                      disabled={!selectedPaymentMonths.includes(invoice.id)}
                      onChange={(event) =>
                        setPaymentAmounts((amounts) => ({
                          ...amounts,
                          [invoice.id]: Math.round(Number(event.target.value || 0) * 100),
                        }))
                      }
                    />
                  </label>
                  );
                })}
              </div>
              <small>
                {remainingPaymentMonths.length} remaining month{remainingPaymentMonths.length === 1 ? "" : "s"}
                {paidPaymentMonths.length ? ` · ${paidPaymentMonths.length} paid` : ""}
                {` · ${money(selectedPaymentBalance)} total received`}
              </small>
            </div>
            {paymentInvoicePayments.length > 0 && (
              <div className="payment-history-list">
                <strong>Payments for this month</strong>
                {groupedPaymentHistory.map((payment) => (
                  <div key={payment.id}>
                    <span>{money(payment.amountMinor)} · {payment.method || "-"}{payment.paymentCount > 1 ? ` · ${payment.paymentCount} partial payments` : ""}</span>
                    {payment.paymentCount === 1 && <button className="ghost-button payment-edit-button" type="button" onClick={() => setEditingPayment(payment)}>Edit</button>}
                  </div>
                ))}
              </div>
            )}
            <form
              className="invoice-payment-form"
              onSubmit={saveInvoicePayment}
            >
              <label>
                Total amount received (PKR)
                <input value={money(selectedPaymentBalance)} readOnly />
              </label>
              <label>
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">Online</option>
                </select>
              </label>
              <div className="modal-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={paymentSaving}
                >
                  {paymentSaving ? "Saving..." : "Save payment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {viewedInvoice && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setViewedInvoice(null);
          }}
        >
          <section
            className="modal invoice-details-modal fee-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-details-title"
          >
            <div className="modal-heading">
              <div>
                <p className="settings-kicker">Fee record</p>
                <h2 id="invoice-details-title">
                  {viewedInvoice.invoiceNumber}
                </h2>
                <p>
                  {viewedStudent.name || viewedInvoice.studentId} ·{" "}
                  {viewedCourse} · {monthName(viewedInvoice.dueDate)}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setViewedInvoice(null)}
                aria-label="Close invoice details"
              >
                <X size={17} />
              </button>
            </div>
            <div className="invoice-detail-summary">
              <span>
                <small>Course amount</small>
                <strong>{money(viewedCourseTotal)}</strong>
              </span>
              <span>
                <small>Paid</small>
                <strong>{money(viewedPaidTotal)}</strong>
              </span>
              <span>
                <small>Remaining</small>
                <strong>{money(viewedRemaining)}</strong>
              </span>
            </div>
            <div className="viewed-fee-list">
              {viewedSessionRows.map((month) => (
                <article className="viewed-fee-item" key={month.id}>
                  <div className="viewed-fee-month">
                    <strong>{monthName(month.dueDate)}</strong>
                    <small>{viewedCourse} · Monthly fee {money(month.amountMinor)}</small>
                  </div>
                  <div className="viewed-fee-amounts">
                    <span>Paid <b>{money(month.paidMinor)}</b></span>
                    <span>Remaining <b>{money(month.remainingMinor)}</b></span>
                  </div>
                  <strong className={`viewed-fee-status ${month.status.toLowerCase()}`}>
                    {month.status === "Paid" && <Check size={13} />}
                    {month.status}
                  </strong>
                </article>
              ))}
              {viewedStudentPayments.length > 0 && (
                <article className="viewed-fee-receipt">
                  <span>
                    <strong>Advance receipt</strong>
                    <small>{viewedReceiptMonths.join(", ")}</small>
                  </span>
                  <b>{money(viewedReceiptAmount)}</b>
                </article>
              )}
              {!viewedSessionRows.length && !viewedStudentPayments.length && (
                <div className="viewed-fee-empty">No payment received yet.</div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setViewedInvoice(null)}
              >
                Close
              </button>
              {viewedMonthRemaining > 0 && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => {
                    setViewedInvoice(null);
                    openInvoicePayment(viewedInvoice);
                  }}
                >
                  Paid
                </button>
              )}
              {viewedStudentPayments.length > 0 && (
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    openInvoiceReceipt(
                      viewedStudentPayments[viewedStudentPayments.length - 1],
                    )
                  }
                >
                  <FileText size={15} /> Voucher
                </button>
              )}
            </div>
          </section>
        </div>
      )}
      {(invoiceForm || (isCollect && form)) && (
        <section className="panel module-form invoice-course-filter">
          <label>
            Course
            <select
              required
              value={invoiceCourseId}
              onChange={(event) => {
                const courseId = event.target.value;
                setInvoiceCourseId(courseId);
                setInvoiceStudentId("");
                if (courseId)
                  setStudents((current) =>
                    current.filter(
                      (student) =>
                        student.courseId === courseId &&
                        invoiceOptions.some(
                          (invoice) =>
                            invoice.studentId === student.id &&
                            invoice.outstandingMinor > 0,
                        ),
                    ),
                  );
                else load();
              }}
            >
              <option value="">Select course first</option>
              {[
                ...new Map(
                  students
                    .filter((student) => student.Course)
                    .map((student) => [student.Course.id, student.Course]),
                ).values(),
              ].map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} - {course.durationMonths} months
                </option>
              ))}
            </select>
          </label>
          <p>
            {invoiceCourseId
              ? `${openInvoiceStudents.length} students with pending fees in this course`
              : "Choose a course to restrict invoice students."}
          </p>
        </section>
      )}
      <section className="page-heading">
        <div>
          <p className="eyebrow">{item.section}</p>
          <h1>{titleFor(item.path)}</h1>
          <p className="heading-subtitle">
            Live institute finance records and balances.
          </p>
        </div>
        {action && (
          <button
            className="primary-button"
            onClick={() => {
              setInvoiceCourseId("");
              setInvoiceStudentId("");
              setForm(action);
            }}
          >
            <Plus size={17} /> {action}
          </button>
        )}
      </section>
      {error && (
        <div className="module-success" style={{ color: "#b44" }}>
          {error}
        </div>
      )}
      <section className="finance-summary">
        <div>
          <span className="finance-summary-icon">
            <Wallet size={17} />
          </span>
          <p>Collected</p>
          <strong>{money(overview?.collectedMinor)}</strong>
          <small>{overview?.invoiceCount || 0} invoices</small>
        </div>
        <div>
          <span className="finance-summary-icon gold">
            <Receipt size={17} />
          </span>
          <p>Pending</p>
          <strong>{money(overview?.pendingMinor)}</strong>
          <small>Outstanding balance</small>
        </div>
        <div>
          <span className="finance-summary-icon green">
            <Check size={17} />
          </span>
          <p>Overdue</p>
          <strong>{money(overview?.overdueMinor)}</strong>
          <small>Needs attention</small>
        </div>
      </section>
      {isCollect && (
        <QuickPayment
          invoices={invoiceOptions}
          onSaved={load}
          onError={setError}
        />
      )}
      {form && (
        <section className="panel module-form">
          <div className="module-form-heading">
            <div>
              <p className="settings-kicker">Finance desk</p>
              <h2>{displayForm}</h2>
              <p>Save this record to the institute database.</p>
            </div>
            <button className="icon-button" onClick={() => setForm(null)}>
              ×
            </button>
          </div>
          <form onSubmit={submit}>
            <div className="module-form-fields">
              {invoiceForm && (
                <>
                  <label>
                    Course
                    <select
                      required
                      value={invoiceCourseId}
                      onChange={(event) => {
                        const courseId = event.target.value;
                        setInvoiceCourseId(courseId);
                        setInvoiceStudentId("");
                        if (courseId)
                          setStudents((current) =>
                            current.filter(
                              (student) =>
                                student.courseId === courseId &&
                                invoiceOptions.some(
                                  (invoice) =>
                                    invoice.studentId === student.id &&
                                    invoice.outstandingMinor > 0,
                                ),
                            ),
                          );
                        else load();
                      }}
                    >
                      <option value="">Select course</option>
                      {[
                        ...new Map(
                          students
                            .filter((student) => student.Course)
                            .map((student) => [
                              student.Course.id,
                              student.Course,
                            ]),
                        ).values(),
                      ].map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} - {course.durationMonths} months
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Student
                    <select
                      name="studentId"
                      required
                      value={invoiceStudentId}
                      onChange={(event) =>
                        setInvoiceStudentId(event.target.value)
                      }
                    >
                      <option value="">Select unpaid student</option>
                      {openInvoiceStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.studentCode})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Amount (PKR)
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      value={
                        selectedInvoiceCourse?.monthlyFeeMinor
                          ? selectedInvoiceCourse.monthlyFeeMinor / 100
                          : ""
                      }
                      readOnly
                      required
                    />
                  </label>
                  <label>
                    Due date
                    <input
                      name="dueDate"
                      type="date"
                      defaultValue={currentDate}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      name="description"
                      placeholder="Monthly course fee"
                    />
                  </label>
                </>
              )}
              {paymentForm && (
                <>
                  <label>
                    Course
                    <select
                      required
                      value={invoiceCourseId}
                      onChange={(event) => {
                        const courseId = event.target.value;
                        setInvoiceCourseId(courseId);
                        setInvoiceStudentId("");
                        if (courseId)
                          setStudents((current) =>
                            current.filter(
                              (student) =>
                                student.courseId === courseId &&
                                invoiceOptions.some(
                                  (invoice) =>
                                    invoice.studentId === student.id &&
                                    invoice.outstandingMinor > 0,
                                ),
                            ),
                          );
                        else load();
                      }}
                    >
                      <option value="">Select course</option>
                      {[
                        ...new Map(
                          students
                            .filter((student) => student.Course)
                            .map((student) => [
                              student.Course.id,
                              student.Course,
                            ]),
                        ).values(),
                      ].map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} - {course.durationMonths} months
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Student
                    <select
                      required
                      value={collectStudentId}
                      onChange={(event) => {
                        setCollectStudentId(event.target.value);
                        setSelectedInvoiceId("");
                      }}
                    >
                      <option value="">Select student</option>
                      {students
                        .filter((student) =>
                          invoiceOptions.some(
                            (invoice) =>
                              invoice.studentId === student.id &&
                              invoice.outstandingMinor > 0,
                          ),
                        )
                        .map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.studentCode})
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Pending invoice
                    <select
                      name="invoiceId"
                      required
                      value={selectedInvoiceId}
                      onChange={(event) =>
                        setSelectedInvoiceId(event.target.value)
                      }
                    >
                      <option value="">Select invoice</option>
                      {invoiceOptions
                        .filter(
                          (invoice) =>
                            invoice.studentId === collectStudentId &&
                            invoice.outstandingMinor > 0,
                        )
                        .map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} -{" "}
                            {money(invoice.outstandingMinor)} due{" "}
                            {invoice.dueDate}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Amount (PKR)
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      max={
                        invoiceOptions.find(
                          (invoice) => invoice.id === selectedInvoiceId,
                        )?.outstandingMinor / 100 || undefined
                      }
                      defaultValue={
                        invoiceOptions.find(
                          (invoice) => invoice.id === selectedInvoiceId,
                        )?.outstandingMinor / 100 || ""
                      }
                      required
                    />
                  </label>
                  <label>
                    Method
                    <select name="method" defaultValue="CASH">
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank transfer</option>
                      <option value="CARD">Card</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </label>
                </>
              )}
              {isScholarships && (
                <>
                  <label>
                    Student
                    <select
                      name="studentId"
                      required
                      value={invoiceStudentId}
                      onChange={(event) =>
                        setInvoiceStudentId(event.target.value)
                      }
                    >
                      <option value="">Select student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.studentCode})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Amount (PKR)
                    <input name="amount" type="number" min="1" required />
                  </label>
                  <label>
                    Type
                    <select name="type" defaultValue="FIXED">
                      <option value="FIXED">Fixed amount</option>
                      <option value="PERCENTAGE">Percentage</option>
                    </select>
                  </label>
                  <label>
                    Percentage
                    <input
                      name="percentage"
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                    />
                  </label>
                  <label>
                    Valid from
                    <input name="validFrom" type="date" required />
                  </label>
                  <label>
                    Valid until
                    <input name="validUntil" type="date" />
                  </label>
                </>
              )}
            </div>
            <div className="module-form-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                <Check size={15} /> Save
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="panel finance-table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h2>
              {isOverview
                ? "Invoice vouchers"
                : isInvoices
                  ? "Current month invoices"
                  : isCollect
                    ? "Recent payments"
                    : isDefaulters
                      ? "Outstanding students"
                      : "Scholarships"}
            </h2>
            <p>
              {loading
                ? "Loading live records..."
                : `${records.length} live records`}
            </p>
          </div>
          <Search size={18} />
        </div>
        <div className="table-tools">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search invoice, student, or code"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className="filter-button"
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
          >
            <option value="">All courses</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <select
            className="filter-button"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {showInvoiceActions ? (
                  <>
                    <th>S:No</th>
                    <th>Student</th>
                    <th>Course</th>
                        <th>Duration</th>
                    <th>Total fees</th>
                    <th>Paid fees</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due date</th>
                    <th>Action</th>
                  </>
                ) : (
                  <>
                    <th>Invoice</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    {isCollect && <th>Receipt</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => {
                const student = record.Student || {};
                const course =
                  students.find((entry) => entry.id === record.studentId)
                    ?.Course ||
                  student.Course ||
                  {};
                const courseTotalMinor = Number(
                  course.totalFeeMinor ||
                    Number(course.durationMonths || 0) *
                      Number(course.monthlyFeeMinor || 0),
                );
                const paidByStudentMinor = payments
                  .filter((payment) => payment.studentId === record.studentId)
                  .reduce(
                    (total, payment) =>
                      total + Number(payment.amountMinor || 0),
                    0,
                  );
                const remainingCourseFee = Math.max(
                  courseTotalMinor - paidByStudentMinor,
                  0,
                );
                const status = isInvoices
                  ? record.cycleStatus || record.status || "PENDING"
                  : record.status || record.method || "ACTIVE";
                const statusLabel =
                  status === "PAID"
                    ? "Paid"
                    : status === "PARTIAL"
                      ? "Partial"
                      : status === "OVERDUE"
                        ? "Defaulter"
                        : "Unpaid";
                const paymentAction = status === "PAID" ? "PAID" : "UNPAID";
                return (
                  <tr key={record.id}>
                    {showInvoiceActions ? (
                      <>
                        <td>
                          <strong>{index + 1}</strong>
                        </td>
                        <td>
                          <strong>
                            {student.name || record.studentId || "-"}
                          </strong>
                        </td>
                        <td>{course.name || "-"}</td>
                        <td>
                          {course.durationMonths
                            ? `${course.durationMonths} months`
                            : "-"}
                        </td>
                        <td>
                          <strong>{money(courseTotalMinor)}</strong>
                        </td>
                        <td>
                          <strong>{money(paidByStudentMinor)}</strong>
                        </td>
                        <td>
                          <strong>{money(remainingCourseFee)}</strong>
                        </td>
                        <td>{isInvoices ? statusLabel : status}</td>
                        <td>
                          {record.dueDate ? (
                            <button
                              className="fee-month-link"
                              type="button"
                              onClick={() =>
                                record.outstandingMinor > 0
                                  ? openInvoicePayment(record)
                                  : openInvoiceView(record)
                              }
                            >
                              {monthName(record.dueDate)}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>
                          <div className="invoice-actions">
                            {isInvoices && (
                              <select
                                className="invoice-action-select"
                                value={paymentAction}
                                onChange={(event) =>
                                  updateInvoicePaymentStatus(record, event)
                                }
                                aria-label={`Payment status for ${student.name || record.studentId}`}
                              >
                                <option value="PAID">Paid</option>
                                <option value="UNPAID">Unpaid</option>
                              </select>
                            )}
                            {isInvoices && (
                              <button
                                className="ghost-button invoice-view-button"
                                type="button"
                                onClick={() => editInvoiceVoucher(record)}
                                aria-label={`Edit voucher for ${student.name || record.studentId}`}
                              >
                                Edit
                              </button>
                            )}
                            {!isInvoices && (
                              <button
                                className="ghost-button invoice-view-button"
                                type="button"
                                onClick={() => openInvoiceView(record)}
                                aria-label={`View fee details for ${student.name || record.studentId}`}
                              >
                                <Eye size={15} /> View
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <strong>
                            {record.invoiceNumber ||
                              record.receiptNumber ||
                              record.id}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {student.name || record.studentId || "-"}
                          </strong>
                        </td>
                        <td>{course.name || "-"}</td>
                        <td>
                          <strong>{money(record.amountMinor)}</strong>
                        </td>
                        <td>{status}</td>
                        <td>{record.dueDate || record.paidAt || "-"}</td>
                        {isCollect && (
                          <td>
                            {record.method === "CASH" && (
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => downloadReceipt(record)}
                              >
                                <FileText size={15} /> PDF
                              </button>
                            )}
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && !filtered.length && (
            <div className="empty-state">No invoice records found.</div>
          )}
        </div>
      </section>
    </>
  );
}

export default FinanceDynamic;
