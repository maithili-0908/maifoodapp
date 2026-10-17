import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  window.history.replaceState({}, "", "/");
});

const menu = [
  {
    id: "truffle-mushroom-pizza",
    name: "Truffle mushroom pizza",
    description: "Roasted mushrooms and mozzarella.",
    price: 549,
    category: "Pizza",
    image: "https://example.com/pizza.jpg",
    rating: 4.9,
    time: "20 min",
    tag: "Bestseller"
  },
  {
    id: "strawberry-milkshake",
    name: "Strawberry dream milkshake",
    description: "Fresh strawberries blended with vanilla.",
    price: 199,
    category: "Milkshakes",
    image: "https://example.com/milkshake.jpg",
    rating: 4.9,
    time: "8 min",
    tag: "Made fresh"
  }
];

const apiResponse = (body) => ({ ok: true, text: async () => JSON.stringify(body) });

describe("Mai ordering experience", () => {
  it("updates and preserves the cart when opening its page from the menu", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse(menu)));
    render(<App />);

    await screen.findByText("Truffle mushroom pizza");
    fireEvent.click(screen.getAllByRole("button", { name: /add to cart/i })[0]);
    expect(screen.getByRole("link", { name: /cart, 1 items/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /cart, 1 items/i }));

    expect(await screen.findByRole("heading", { name: /Your cart/ })).toBeInTheDocument();
    expect(screen.getByText("Truffle mushroom pizza")).toBeInTheDocument();
    expect(screen.getByText("₹598")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/cart");
  });

  it("takes the Menu navigation link to the menu section", async () => {
    window.history.replaceState({}, "", "/menu#our-story");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse(menu)));
    render(<App />);
    await screen.findByText("Truffle mushroom pizza");

    fireEvent.click(screen.getByRole("link", { name: "Menu" }));

    expect(window.location.pathname).toBe("/menu");
    expect(window.location.hash).toBe("#menu");
    expect(screen.getByRole("tablist", { name: "Filter menu by category" })).toBeInTheDocument();
  });

  it("shows a menu-page link when opening an empty cart", async () => {
    window.history.replaceState({}, "", "/cart");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse(menu)));
    render(<App />);

    expect(await screen.findByText(/Your cart is waiting/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse the menu/i })).toHaveAttribute("href", "/menu");
    expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled();
  });

  it("shows placed orders on the dedicated order history page", async () => {
    const order = {
      id: "order-history-1",
      status: "Kitchen received your order",
      total: 598,
      estimatedArrival: new Date(Date.now() + 35 * 60_000).toISOString(),
      estimatedDeliveryMinutes: 35,
      createdAt: new Date().toISOString(),
      items: [{ id: "truffle-mushroom-pizza", name: "Truffle mushroom pizza", price: 549, quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" },
      payment: { method: "upi", status: "confirmed-simulated" }
    };
    window.history.replaceState({}, "", "/orders");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse([order])));
    render(<App />);

    expect(await screen.findByRole("heading", { name: /every order/i })).toBeInTheDocument();
    expect(screen.getByText(/order-history-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Truffle mushroom pizza/)).toBeInTheDocument();
    expect(screen.getByText("₹598")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view order order-history-1 details/i })).toHaveAttribute("href", "/orders/order-history-1");
  });

  it("shows an individual order summary and delivery details", async () => {
    const order = {
      id: "order-detail-1",
      status: "Delivery agent assigned",
      total: 647,
      subtotal: 598,
      deliveryFee: 49,
      estimatedArrival: new Date(Date.now() + 35 * 60_000).toISOString(),
      estimatedDeliveryMinutes: 35,
      createdAt: new Date().toISOString(),
      statusEvents: [{ status: "Delivery agent assigned", timestamp: new Date().toISOString() }],
      items: [{ id: "truffle-mushroom-pizza", name: "Truffle mushroom pizza", price: 598, quantity: 1 }],
      customer: { name: "Mai Tester", address: "12 Main Street", phone: "555-123-4567" },
      payment: { method: "cash-on-delivery", status: "pay-on-delivery" }
    };
    window.history.replaceState({}, "", "/orders/order-detail-1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse(order)));
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Order summary" })).toBeInTheDocument();
    expect(screen.getByText("Mai Tester")).toBeInTheDocument();
    expect(screen.getByText("12 Main Street")).toBeInTheDocument();
    expect(screen.getByText("Cash on delivery")).toBeInTheDocument();
    expect(screen.getAllByText("Delivery agent assigned").length).toBeGreaterThan(0);
    expect(screen.getByText("₹647")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /all orders/i })).toHaveAttribute("href", "/orders");
  });

  it("explains an unavailable API and retries loading the menu", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(apiResponse(menu));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Mai API is not reachable/i);
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Truffle mushroom pizza")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("renders menu and adds a dish to the cart", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse(menu)));
    render(<App />);

    expect(await screen.findByText("Truffle mushroom pizza")).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Main navigation" }))
      .getAllByRole("link").map((link) => link.textContent.trim())).toEqual(["Our story", "Menu"]);
    fireEvent.click(screen.getAllByRole("button", { name: /add to cart/i })[0]);

    expect(screen.getByText(/1 item/)).toBeInTheDocument();
    expect(screen.getAllByText(/549/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("link", { name: /cart, 1 items/i }));
    expect(await screen.findByRole("heading", { name: /Your cart/ })).toBeInTheDocument();
    expect(screen.getByText(/598/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /place order/i })).toBeEnabled();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("finds pizza by name and offers the added food categories", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(apiResponse(menu)));
    render(<App />);

    await screen.findByText("Truffle mushroom pizza");
    fireEvent.change(screen.getByRole("textbox", { name: /search the menu/i }), { target: { value: "pizza" } });
    expect(screen.getByText("Truffle mushroom pizza")).toBeInTheDocument();
    expect(screen.queryByText("Strawberry dream milkshake")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: /search the menu/i }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("tab", { name: /Milkshakes/i }));
    expect(screen.getByText("Strawberry dream milkshake")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Fresh Juice/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Biriyani/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pasta/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cakes/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Waffles/i })).toBeInTheDocument();
  });

  it("collects delivery details and payment before placing the order", async () => {
    const order = {
      id: "order-123",
      status: "Kitchen received your order",
      total: 598,
      subtotal: 549,
      deliveryFee: 49,
      estimatedArrival: new Date(Date.now() + 35 * 60_000).toISOString(),
      estimatedDeliveryMinutes: 35,
      statusEvents: [{ status: "Kitchen received your order", timestamp: new Date().toISOString() }],
      items: [{ id: "truffle-mushroom-pizza", name: "Truffle mushroom pizza", price: 549, quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" },
      payment: { method: "upi", status: "confirmed-simulated" }
    };
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(apiResponse(menu))
      .mockResolvedValueOnce(apiResponse(order))
      .mockResolvedValue(apiResponse(order)));
    render(<App />);

    await screen.findByText("Truffle mushroom pizza");
    fireEvent.click(screen.getAllByRole("button", { name: /add to cart/i })[0]);
    fireEvent.click(screen.getByRole("link", { name: /cart, 1 items/i }));
    await screen.findByRole("heading", { name: /Your cart/ });
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Mai" } });
    fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: "12 Main Street" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "555-123-4567" } });
    fireEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(screen.getByText(/upi is simulated/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm order/i }));

    await waitFor(() => expect(screen.getAllByText("Kitchen received your order").length).toBeGreaterThan(0));
    expect(screen.getByText(/Estimated arrival/i)).toBeInTheDocument();
    expect(screen.getByText(/about 35 min/i)).toBeInTheDocument();
    expect(screen.getByText(/order-123/i)).toBeInTheDocument();
    expect(screen.getByText("UPI payment")).toBeInTheDocument();
    expect(screen.getByText("Delivery agent assigned")).toBeInTheDocument();
    expect(screen.getByText("Delivery agent picked up your order")).toBeInTheDocument();
  });

  it("confirms cash on delivery", async () => {
    const order = {
      id: "order-cod",
      status: "Kitchen received your order",
      total: 598,
      subtotal: 549,
      deliveryFee: 49,
      estimatedArrival: new Date(Date.now() + 35 * 60_000).toISOString(),
      estimatedDeliveryMinutes: 35,
      statusEvents: [{ status: "Kitchen received your order", timestamp: new Date().toISOString() }],
      items: [{ id: "truffle-mushroom-pizza", name: "Truffle mushroom pizza", price: 549, quantity: 1 }],
      customer: { name: "Mai", address: "12 Main Street", phone: "555-123-4567" },
      payment: { method: "cash-on-delivery", status: "pay-on-delivery" }
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(apiResponse(menu))
      .mockResolvedValueOnce(apiResponse(order))
      .mockResolvedValue(apiResponse(order));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);

    await screen.findByText("Truffle mushroom pizza");
    fireEvent.click(screen.getAllByRole("button", { name: /add to cart/i })[0]);
    fireEvent.click(screen.getByRole("link", { name: /cart, 1 items/i }));
    await screen.findByRole("heading", { name: /Your cart/ });
    fireEvent.click(screen.getByRole("button", { name: /place order/i }));
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Mai" } });
    fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: "12 Main Street" } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: "555-123-4567" } });
    fireEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    fireEvent.click(screen.getByRole("radio", { name: /cash on delivery/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm order/i }));

    await screen.findByText(/order-cod/i);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).paymentMethod).toBe("cash-on-delivery");
  });
});
