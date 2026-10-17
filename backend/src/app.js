import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { menu } from "./menu.js";

const deliveryFee = 49;
const validStatuses = [
  "Kitchen received your order",
  "Kitchen started working on your order",
  "Delivery agent assigned",
  "Your order is ready for pickup",
  "Delivery agent picked up your order",
  "Your order is on the way",
  "Delivered"
];
const orders = new Map();
const orderTimers = new Map();

export const app = express();
app.use(cors());
app.use(express.json());

function validateOrder(body) {
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return "Add at least one item to your order.";
  }
  for (const item of body.items) {
    if (!item || typeof item.id !== "string" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return "Each item needs a valid id and a quantity between 1 and 20.";
    }
    if (!menu.some((menuItem) => menuItem.id === item.id)) {
      return `Menu item "${item.id}" was not found.`;
    }
  }
  const { name, address, phone } = body.customer ?? {};
  if (![name, address, phone].every((value) => typeof value === "string" && value.trim())) {
    return "Name, delivery address, and phone number are required.";
  }
  if (!/^[+()\d\s-]{7,20}$/.test(phone.trim())) {
    return "Enter a valid phone number.";
  }
  if (body.paymentMethod !== undefined && !["upi", "cash-on-delivery"].includes(body.paymentMethod)) {
    return "Choose a supported payment method.";
  }
  return null;
}

function appendStatus(order, status, timestamp = new Date()) {
  order.status = status;
  order.updatedAt = timestamp.toISOString();
  order.statusEvents.push({ status, timestamp: timestamp.toISOString() });
}

function clearOrderTimers(orderId) {
  const timers = orderTimers.get(orderId) ?? [];
  timers.forEach(clearTimeout);
  orderTimers.delete(orderId);
}

function progressOrder(orderId, preparationMinutes) {
  const preparationMs = preparationMinutes * 60_000;
  const milestones = [
    { status: "Kitchen started working on your order", delay: Math.max(15_000, preparationMs * 0.1) },
    { status: "Delivery agent assigned", delay: preparationMs * 0.7 },
    { status: "Your order is ready for pickup", delay: preparationMs },
    { status: "Delivery agent picked up your order", delay: preparationMs + 2 * 60_000 },
    { status: "Your order is on the way", delay: preparationMs + 3 * 60_000 },
    { status: "Delivered", delay: preparationMs + 15 * 60_000 }
  ];
  const timers = milestones.map(({ status, delay }) => {
    const timer = setTimeout(() => {
      const order = orders.get(orderId);
      if (!order) return;
      appendStatus(order, status);
      if (status === "Delivered") clearOrderTimers(orderId);
    }, delay);
    timer.unref?.();
    return timer;
  });
  orderTimers.set(orderId, timers);
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/menu", (_req, res) => {
  res.json(menu);
});

app.get("/api/orders", (_req, res) => {
  res.json([...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.post("/api/orders", (req, res) => {
  const error = validateOrder(req.body);
  if (error) return res.status(400).json({ error });

  const items = req.body.items.map(({ id, quantity }) => {
    const menuItem = menu.find((item) => item.id === id);
    return {
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      preparationMinutes: menuItem.preparationMinutes
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const preparationMinutes = Math.max(...items.map((item) => item.preparationMinutes));
  const estimatedDeliveryMinutes = preparationMinutes + 15;
  const createdAt = new Date();
  const estimatedArrival = new Date(createdAt.getTime() + estimatedDeliveryMinutes * 60_000);
  const paymentMethod = req.body.paymentMethod ?? "upi";
  const order = {
    id: randomUUID(),
    customer: {
      name: req.body.customer.name.trim(),
      address: req.body.customer.address.trim(),
      phone: req.body.customer.phone.trim()
    },
    items,
    preparationMinutes,
    estimatedDeliveryMinutes,
    estimatedArrival: estimatedArrival.toISOString(),
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee,
    total: Number((subtotal + deliveryFee).toFixed(2)),
    payment: {
      method: paymentMethod,
      status: paymentMethod === "upi" ? "confirmed-simulated" : "pay-on-delivery"
    },
    status: "Kitchen received your order",
    statusEvents: [{ status: "Kitchen received your order", timestamp: createdAt.toISOString() }],
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString()
  };
  orders.set(order.id, order);
  progressOrder(order.id, preparationMinutes);
  res.status(201).json(order);
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json(order);
});

app.patch("/api/orders/:id/status", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (!validStatuses.includes(req.body?.status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}.` });
  }
  appendStatus(order, req.body.status);
  res.json(order);
});

app.delete("/api/orders/:id", (req, res) => {
  if (!orders.has(req.params.id)) return res.status(404).json({ error: "Order not found." });
  clearOrderTimers(req.params.id);
  orders.delete(req.params.id);
  res.status(204).end();
});

export function resetOrders() {
  for (const orderId of orderTimers.keys()) clearOrderTimers(orderId);
  orders.clear();
}
