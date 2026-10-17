import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { app, resetOrders } from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));
beforeEach(() => resetOrders());

test("GET /api/health reports that the API is ready", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("GET /api/menu returns menu items with required fields", async () => {
  const response = await fetch(`${baseUrl}/api/menu`);
  const items = await response.json();
  assert.equal(response.status, 200);
  assert.ok(items.every((item) => item.id && item.name && item.description && item.price > 0 && item.image));
  assert.ok(items.some((item) => item.name === "Truffle mushroom pizza"));
  const suffixes = {
    Pizza: "pizza",
    Burgers: "burger",
    Bowls: "bowl",
    Milkshakes: "milkshake",
    "Fresh Juice": "juice",
    Biriyani: "biriyani",
    Pasta: "pasta",
    Cakes: "cake",
    Waffles: "waffle"
  };
  for (const [category, suffix] of Object.entries(suffixes)) {
    const dishes = items.filter((item) => item.category === category);
    assert.equal(dishes.length, 5, `${category} should have five menu items`);
    assert.ok(dishes.every((item) => item.name.toLowerCase().endsWith(suffix)));
    assert.equal(new Set(dishes.map((item) => item.image)).size, 5, `${category} should have a different image for every dish`);
  }
});

test("POST /api/orders validates customer and item input", async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items: [], customer: {} })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /at least one item/i);
});

test("POST /api/orders rejects unknown items and invalid phone numbers", async () => {
  const invalidOrders = [
    {
      items: [{ id: "not-on-the-menu", quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" }
    },
    {
      items: [{ id: "truffle-mushroom-pizza", quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "not a phone" }
    },
    {
      items: [{ id: "truffle-mushroom-pizza", quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" },
      paymentMethod: "unknown"
    }
  ];
  for (const order of invalidOrders) {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(order)
    });
    assert.equal(response.status, 400);
  }
});

test("orders can be created, retrieved, status-updated, listed, and deleted", async () => {
  const createdResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      items: [{ id: "truffle-mushroom-pizza", quantity: 2 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" },
      paymentMethod: "upi"
    })
  });
  const created = await createdResponse.json();
  assert.equal(createdResponse.status, 201);
  assert.equal(created.status, "Kitchen received your order");
  assert.equal(created.total, 1147);
  assert.equal(created.preparationMinutes, 20);
  assert.equal(created.estimatedDeliveryMinutes, 35);
  assert.ok(Date.parse(created.estimatedArrival) > Date.parse(created.createdAt));
  assert.deepEqual(created.payment, { method: "upi", status: "confirmed-simulated" });
  assert.deepEqual(created.statusEvents[0].status, "Kitchen received your order");

  const fetched = await fetch(`${baseUrl}/api/orders/${created.id}`);
  assert.equal((await fetched.json()).id, created.id);

  const updated = await fetch(`${baseUrl}/api/orders/${created.id}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "Delivery agent assigned" })
  });
  const updatedOrder = await updated.json();
  assert.equal(updatedOrder.status, "Delivery agent assigned");
  assert.equal(updatedOrder.statusEvents.at(-1).status, "Delivery agent assigned");

  const listed = await fetch(`${baseUrl}/api/orders`);
  assert.equal((await listed.json()).length, 1);

  const deleted = await fetch(`${baseUrl}/api/orders/${created.id}`, { method: "DELETE" });
  assert.equal(deleted.status, 204);
  assert.equal((await fetch(`${baseUrl}/api/orders/${created.id}`)).status, 404);
});

test("cash-on-delivery orders are accepted with payment due at delivery", async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      items: [{ id: "tava-fried-burger", quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" },
      paymentMethod: "cash-on-delivery"
    })
  });
  const order = await response.json();
  assert.equal(response.status, 201);
  assert.deepEqual(order.payment, { method: "cash-on-delivery", status: "pay-on-delivery" });
});

test("PATCH /api/orders/:id/status rejects an unknown status", async () => {
  const createdResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      items: [{ id: "smash-classic-burger", quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" }
    })
  });
  const { id } = await createdResponse.json();
  const response = await fetch(`${baseUrl}/api/orders/${id}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "On the moon" })
  });
  assert.equal(response.status, 400);
});
