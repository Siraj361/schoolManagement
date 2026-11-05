require("dotenv").config();
const { Op } = require("sequelize");
const sequelize = require("../src/config/database");
const { Invoice, Payment } = require("../src/models");

const monthDate = (offset) => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 10);
};

const run = async () => {
  const transaction = await sequelize.transaction();
  try {
    const invoices = await Invoice.findAll({ where: { sequenceNumber: { [Op.not]: null } }, order: [["studentId", "ASC"], ["sequenceNumber", "ASC"]], transaction });
    for (const invoice of invoices) {
      const paidMinor = await Payment.sum("amountMinor", { where: { invoiceId: invoice.id }, transaction }) || 0;
      if (paidMinor > 0) continue;
      await invoice.update({ dueDate: monthDate(invoice.sequenceNumber - 1), status: "PENDING" }, { transaction });
    }
    await transaction.commit();
    console.log(`Repaired ${invoices.length} scheduled invoices; paid invoices were preserved.`);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
