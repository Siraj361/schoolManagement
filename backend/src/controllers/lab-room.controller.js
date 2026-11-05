const { Op } = require("sequelize");
const { LabRoom, BatchSession, Batch, Course } = require("../models");

const list = async (req, res, next) => {
  try {
    const where = { instituteId: req.user.instituteId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.networkStatus) where.networkStatus = req.query.networkStatus;
    if (req.query.search) where[Op.or] = [{ name: { [Op.like]: `%${req.query.search}%` } }, { type: { [Op.like]: `%${req.query.search}%` } }];
    const rooms = await LabRoom.findAll({ where, order: [["name", "ASC"]] });
    const sessions = await BatchSession.findAll({ where: { instituteId: req.user.instituteId, status: "SCHEDULED", date: { [Op.gte]: new Date().toISOString().slice(0, 10) } }, include: [{ model: Batch, attributes: ["id", "name"], include: [{ model: Course, attributes: ["id", "name"] }] }] });
    const sessionByRoom = new Map(sessions.filter((session) => session.room).map((session) => [session.room, session]));
    const items = rooms.map((room) => ({ ...room.toJSON(), allocation: sessionByRoom.get(room.name) || null, usagePercent: room.capacity ? Math.round((Number(room.usedCapacity) / Number(room.capacity)) * 100) : 0 }));
    const capacity = items.reduce((summary, room) => { summary.total += Number(room.capacity); summary.used += Number(room.usedCapacity); return summary; }, { total: 0, used: 0 });
    return res.json({ success: true, data: { items, summary: { totalRooms: items.length, availableRooms: items.filter((room) => room.status === "AVAILABLE").length, totalCapacity: capacity.total, usedCapacity: capacity.used, availableCapacity: Math.max(capacity.total - capacity.used, 0), roomsInUse: items.filter((room) => room.status === "IN_USE").length, networkOnline: items.filter((room) => room.networkStatus === "ONLINE").length } } });
  } catch (error) { return next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, type, capacity, usedCapacity, networkStatus, status } = req.body;
    if (!name?.trim() || !type?.trim() || !Number.isFinite(Number(capacity)) || Number(capacity) < 0) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name, type, and non-negative capacity are required" } });
    if (Number(usedCapacity || 0) > Number(capacity)) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Used capacity cannot exceed capacity" } });
    const room = await LabRoom.create({ instituteId: req.user.instituteId, name: name.trim(), type: type.trim(), capacity: Number(capacity), usedCapacity: Number(usedCapacity || 0), networkStatus: ["ONLINE", "MAINTENANCE", "OFFLINE"].includes(networkStatus) ? networkStatus : "ONLINE", status: ["AVAILABLE", "IN_USE", "MAINTENANCE"].includes(status) ? status : "AVAILABLE" });
    return res.status(201).json({ success: true, data: { item: room } });
  } catch (error) { return next(error); }
};

module.exports = { list, create };
