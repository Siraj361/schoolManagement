const router = require("express").Router();
const finance = require("../controllers/finance.controller");
const { requireAuth } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const expense = require("../controllers/expense.controller");

router.use(requireAuth);
router.get("/", authorize("fees.read"), finance.overview);
router.get("/invoices", authorize("fees.read"), finance.listInvoices);
router.post("/invoices", authorize("fees.write"), finance.createInvoice);
router.patch("/invoices/:invoiceId", authorize("fees.write"), finance.updateInvoiceStatus);
router.post("/collect", authorize("fees.collect"), finance.collectPayment);
router.patch("/payments/:paymentId", authorize("fees.collect"), finance.updatePayment);
router.get("/payments", authorize("fees.read"), finance.listPayments);
router.get("/payments/recent", authorize("fees.read"), finance.recentPayments);
router.get("/defaulters", authorize("fees.read"), finance.defaulters);
router.get("/scholarships", authorize("fees.read"), finance.listScholarships);
router.post("/scholarships", authorize("fees.write"), finance.createScholarship);
router.get("/expenses", authorize("fees.read"), expense.list);
router.post("/expenses", authorize("fees.write"), expense.create);
router.patch("/expenses/:expenseId/status", authorize("fees.write"), expense.updateStatus);

module.exports = router;
