import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CalendarDays,
  ChefHat,
  Clock3,
  MapPin,
  Smartphone,
  Leaf,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
  Utensils
} from "lucide-react";

const API_URL = `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api`;
const categories = ["All", "Pizza", "Burgers", "Bowls", "Milkshakes", "Fresh Juice", "Biriyani", "Pasta", "Cakes", "Waffles"];
const categoryIcons = {
  All: "✨",
  Pizza: "🍕",
  Burgers: "🍔",
  Bowls: "🥗",
  Milkshakes: "🥤",
  "Fresh Juice": "🍊",
  Biriyani: "🍛",
  Pasta: "🍝",
  Cakes: "🍰",
  Waffles: "🧇"
};
const deliverySteps = [
  "Kitchen received your order",
  "Kitchen started working on your order",
  "Delivery agent assigned",
  "Your order is ready for pickup",
  "Delivery agent picked up your order",
  "Your order is on the way",
  "Delivered"
];
const money = (amount) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
}).format(Number(amount));
const formatTime = (value) => new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const formatDate = (value) => new Date(value).toLocaleString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});
const CART_STORAGE_KEY = "mai-food-delivery-cart";

function readCart() {
  try {
    const storedCart = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "{}");
    if (!storedCart || Array.isArray(storedCart) || typeof storedCart !== "object") return {};
    return Object.fromEntries(
      Object.entries(storedCart).filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0 && quantity <= 20)
    );
  } catch (error) {
    console.error("Unable to restore the saved Mai cart.", error);
    return {};
  }
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  const hash = new URL(path, window.location.origin).hash;
  if (hash) {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      target?.scrollIntoView?.({ behavior: "smooth" });
    });
  }
}

function handleNavigation(event, path) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigateTo(path);
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Mai API is not reachable. Run `npm run dev` from the project root to start the API and storefront.");
  }
  const responseText = response.status === 204 ? "" : await response.text();
  let body = null;
  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      throw new Error("Mai API returned an unexpected response. Restart both servers with `npm run dev` from the project root.");
    }
  }
  if (!response.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
  return body;
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const onLocationChange = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  }, []);

  const orderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (pathname === "/orders" || orderMatch) {
    return <OrdersPage orderId={orderMatch ? decodeURIComponent(orderMatch[1]) : null} />;
  }
  return <Storefront page={pathname === "/cart" ? "cart" : "menu"} />;
}

function OrdersPage({ orderId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cartCount = Object.values(readCart()).reduce((total, quantity) => total + quantity, 0);
  const selectedOrder = orderId ? orders[0] : null;

  useEffect(() => {
    let cancelled = false;
    const endpoint = orderId ? `${API_URL}/orders/${encodeURIComponent(orderId)}` : `${API_URL}/orders`;
    const loadOrders = () => request(endpoint)
      .then((result) => {
        if (!cancelled) {
          setOrders(orderId ? [result] : result);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    loadOrders();
    const timer = window.setInterval(loadOrders, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [orderId]);

  return (
    <div className="app-shell orders-shell">
      <header className="topbar">
        <a className="brand" href="/menu" onClick={(event) => handleNavigation(event, "/menu")} aria-label="Mai home">
          <span className="brand-mark"><Utensils size={19} strokeWidth={2.5} /></span>
          <span>mai<span className="brand-period">.</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="/menu#our-story">Our story</a>
          <a href="/menu#menu" onClick={(event) => handleNavigation(event, "/menu#menu")}>Menu</a>
        </nav>
        <div className="header-actions">
          <a className="cart-link" href="/cart" onClick={(event) => handleNavigation(event, "/cart")} aria-label={`Cart, ${cartCount} items`}><ShoppingCart size={16} /> Cart <span className="cart-count">{cartCount}</span></a>
          <a className="cart-link" href="/orders" onClick={(event) => handleNavigation(event, "/orders")}>Your orders</a>
        </div>
      </header>

      <main className="orders-page">
        <div className="orders-page-heading">
          <div className="eyebrow section-eyebrow">YOUR MAI ORDER HISTORY</div>
          <h1>{orderId ? "Order summary." : <>Every order,<br className="mobile-break" /> all in one place<span>.</span></>}</h1>
          <p>{orderId ? "Here are the details and live updates for your order." : "Check your past orders, totals, and live delivery updates."}</p>
        </div>

        {error && <div className="alert-message" role="alert">{error} <button className="retry-menu-button" type="button" onClick={() => window.location.reload()}>Retry</button></div>}
        {loading ? (
          <div className="loading-state">Loading your orders...</div>
        ) : error ? null : orderId && !selectedOrder ? (
          <div className="empty-orders"><span>🔎</span><h2>We couldn't find that order</h2><a className="orders-primary-button" href="/orders">Back to your orders</a></div>
        ) : orderId && selectedOrder ? (
          <OrderDetail order={selectedOrder} />
        ) : orders.length ? (
          <div className="orders-list">
            {orders.map((order) => {
              const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
              const firstItem = order.items[0];
              const additionalItems = order.items.length - 1;
              return (
                <article className="order-list-card" key={order.id}>
                  <div className="order-list-top">
                    <div>
                      <span className="order-list-label">ORDER #{order.id}</span>
                      <span className="order-list-date"><CalendarDays size={13} /> {formatDate(order.createdAt)}</span>
                    </div>
                    <span className="status-badge"><span className="live-dot" /> {order.status}</span>
                  </div>
                  <div className="order-list-main">
                    <div className="order-list-dishes">
                      <strong>{itemCount} {itemCount === 1 ? "item" : "items"}</strong>
                      <span>{firstItem.name}{additionalItems > 0 ? ` + ${additionalItems} more` : ""}</span>
                    </div>
                    <div className="order-list-eta"><Clock3 size={15} /><span>ETA <strong>{formatTime(order.estimatedArrival)}</strong></span></div>
                    <div className="order-list-total"><small>Order total</small><strong>{money(order.total)}</strong></div>
                    <a className="order-detail-link" href={`/orders/${encodeURIComponent(order.id)}`} aria-label={`View order ${order.id} details`}><ArrowRight size={17} /></a>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-orders"><span>🛍️</span><h2>No orders just yet</h2><p>Once you place an order, its summary and delivery updates will show up here.</p><a className="orders-primary-button" href="/menu">Explore the menu <ArrowRight size={15} /></a></div>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="/menu"><span className="brand-mark"><Utensils size={17} /></span><span>mai<span className="brand-period">.</span></span></a>
        <span>Good food, good mood. © 2026 Mai.</span>
        <span className="footer-made"><ChefHat size={15} /> Made fresh, always.</span>
      </footer>
    </div>
  );
}

function OrderDetail({ order }) {
  const activeIndex = deliverySteps.indexOf(order.status);
  return (
    <div className="order-detail-layout">
      <section className="order-detail-card">
        <div className="order-detail-header">
          <div>
            <span className="order-list-label">ORDER #{order.id}</span>
            <span className="order-list-date"><CalendarDays size={13} /> Placed {formatDate(order.createdAt)}</span>
          </div>
          <a className="back-step-button" href="/orders"><ArrowLeft size={14} /> All orders</a>
        </div>
        <div className="detail-status-heading">
          <span className="tracking-icon"><Truck size={23} /></span>
          <div><h2>{order.status === "Delivered" ? "Order delivered!" : "Order placed!"}</h2><p>Live updates for this delivery</p></div>
        </div>
        <div className="eta-card">
          <Clock3 size={18} />
          <span><strong>Estimated arrival</strong><small>{formatTime(order.estimatedArrival)} · about {order.estimatedDeliveryMinutes} min</small></span>
          <span className="status-badge"><span className="live-dot" /> {order.status}</span>
        </div>
        <div className="detail-timeline">
          {deliverySteps.map((step, index) => {
            const event = order.statusEvents?.find((statusEvent) => statusEvent.status === step);
            const complete = index < activeIndex || order.status === "Delivered" && index === activeIndex;
            const active = index === activeIndex && order.status !== "Delivered";
            return (
              <div key={step} className={`status-step ${complete ? "complete" : ""} ${active ? "active" : ""}`}>
                <span className="step-marker">{complete ? <Check size={13} /> : index + 1}</span>
                <span className="step-copy">{step}{event && <small>{formatTime(event.timestamp)}</small>}</span>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="order-detail-card order-receipt">
        <h2>Order summary</h2>
        <div className="receipt-items">
          {order.items.map((item) => (
            <div className="receipt-item" key={item.id}>
              <span className="receipt-quantity">{item.quantity}×</span>
              <span className="receipt-name">{item.name}</span>
              <strong>{money(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="receipt-totals">
          <div><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          <div><span>Delivery</span><span>{money(order.deliveryFee)}</span></div>
          <div className="receipt-total"><strong>Total</strong><strong>{money(order.total)}</strong></div>
        </div>
        <div className="receipt-info">
          <div className="receipt-info-heading"><MapPin size={15} /><strong>Delivery details</strong></div>
          <strong>{order.customer.name}</strong>
          <span>{order.customer.address}</span>
          <span>{order.customer.phone}</span>
        </div>
        <div className="receipt-payment">
          <span>Payment method</span>
          <strong>{order.payment?.method === "upi" ? "UPI payment" : "Cash on delivery"}</strong>
          <small>{order.payment?.method === "upi" ? "UPI payment confirmed (demo)" : "Pay when your order arrives"}</small>
        </div>
      </aside>
    </div>
  );
}

function Storefront({ page }) {
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState(readCart);
  const [customer, setCustomer] = useState({ name: "", address: "", phone: "" });
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setMenuError("");
    try {
      const items = await request(`${API_URL}/menu`);
      setMenu(items);
    } catch (requestError) {
      setMenuError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!order || order.status === "Delivered") return undefined;
    const timer = window.setInterval(() => {
      request(`${API_URL}/orders/${order.id}`)
        .then(setOrder)
        .catch((requestError) => setError(requestError.message));
    }, 5000);
    return () => window.clearInterval(timer);
  }, [order?.id, order?.status]);

  const visibleMenu = useMemo(() => menu.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [menu, activeCategory, search]);

  const cartItems = menu.filter((item) => cart[item.id]).map((item) => ({
    ...item,
    quantity: cart[item.id]
  }));
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryFee = itemCount ? 49 : 0;

  function updateQuantity(id, change) {
    setCart((current) => {
      const quantity = (current[id] || 0) + change;
      const updated = { ...current };
      if (quantity <= 0) delete updated[id];
      else updated[id] = Math.min(quantity, 20);
      return updated;
    });
    setError("");
  }

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setPlacingOrder(true);
    try {
      const placed = await request(`${API_URL}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(({ id, quantity }) => ({ id, quantity })),
          customer,
          paymentMethod
        })
      });
      setOrder(placed);
      setCart({});
      setCheckoutStep("cart");
      window.localStorage.removeItem(CART_STORAGE_KEY);
      navigateTo(`/orders/${encodeURIComponent(placed.id)}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPlacingOrder(false);
    }

  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/menu" onClick={(event) => handleNavigation(event, "/menu")} aria-label="Mai home">
          <span className="brand-mark"><Utensils size={19} strokeWidth={2.5} /></span>
          <span>mai<span className="brand-period">.</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          {page === "menu" && <a href="#our-story">Our story</a>}
          <a className={page === "menu" ? "nav-active" : ""} href="/menu#menu" onClick={(event) => handleNavigation(event, "/menu#menu")}>Menu</a>
        </nav>
        <div className="header-actions">
          <a className={`cart-link ${page === "cart" ? "nav-active" : ""}`} href="/cart" onClick={(event) => handleNavigation(event, "/cart")} aria-label={`Cart, ${itemCount} items`}>
            <ShoppingCart size={17} />
            <span>Cart</span>
            <span className="cart-count">{itemCount}</span>
          </a>
          <a className="cart-link" href="/orders" onClick={(event) => handleNavigation(event, "/orders")}>Your orders</a>
        </div>
      </header>

      <main>
        {page === "menu" && <section className="hero" id="our-story">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> GOOD FOOD, GOOD MOOD</div>
            <h1>A little joy<br />in every <span>bite.</span></h1>
            <p>Made with love, delivered with a smile.<br className="desktop-break" /> Your next favorite meal is just a little scroll away.</p>
            <a className="hero-cta" href="#menu">Explore the menu <ArrowRight size={17} /></a>
            <div className="hero-social-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>J</span><span>M</span><span>A</span><span>K</span>
              </div>
              <div><div className="proof-stars"><Star size={13} fill="currentColor" /> 4.9 <span>(2.4k+ happy meals)</span></div><small>Real food. Real good.</small></div>
            </div>
          </div>
          <div className="hero-art" aria-label="Fresh pizza topped with basil">
            <div className="hero-image" />
            <div className="floating-note note-top"><span className="note-icon green"><Leaf size={17} /></span><span><strong>Always fresh</strong><small>Good things, made daily</small></span></div>
            <div className="floating-note note-bottom"><span className="note-icon peach"><Clock3 size={17} /></span><span><strong>Fresh to your door</strong><small>Live ETA with every order</small></span></div>
            <span className="hero-sparkle sparkle-one">✳</span><span className="hero-sparkle sparkle-two">✳</span>
          </div>
          <div className="hero-bottom-note"><span>01</span><span className="note-line" /> FRESHLY MADE, EVERY DAY</div>
        </section>}

        <section className={`content-layout ${page === "cart" ? "cart-layout" : "menu-layout"}`} id={page === "menu" ? "menu" : "cart-page"}>
          {page === "cart" && (
            <div className="cart-page-intro">
              <div className="eyebrow section-eyebrow">READY WHEN YOU ARE</div>
              <h1>Your cart<span>.</span></h1>
              <p>Review your picks, add delivery details, and place your order.</p>
            </div>
          )}
          {page === "cart" && menuError && <div className="alert-message" role="alert">{menuError} <button className="retry-menu-button" type="button" onClick={loadMenu}>Retry</button></div>}
          {page === "menu" && itemCount > 0 && (
            <div className="cart-updated-banner">
              <span><ShoppingCart size={17} /> Cart updated · {itemCount} {itemCount === 1 ? "item" : "items"} · {money(subtotal + deliveryFee)}</span>
              <a href="/cart" onClick={(event) => handleNavigation(event, "/cart")}>Review cart <ArrowRight size={15} /></a>
            </div>
          )}
          {page === "menu" && <>
          <div className="menu-section">
            <div className="section-heading">
              <div>
                <div className="eyebrow section-eyebrow">A LITTLE SOMETHING FOR EVERYONE</div>
                <h2>Made for your <span>mood.</span></h2>
              </div>
              <label className="search-box">
                <Search size={17} />
                <input aria-label="Search the menu" placeholder="Find your craving..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
            </div>

            <div className="category-row" role="tablist" aria-label="Filter menu by category">
              {categories.map((category) => (
                <button key={category} type="button" role="tab" aria-selected={activeCategory === category} className={`category-chip ${activeCategory === category ? "selected" : ""}`} onClick={() => setActiveCategory(category)}>
                  {categoryIcons[category]} <span>{category}</span>
                </button>
              ))}
              <span className="menu-count">{visibleMenu.length} delicious things</span>
            </div>

            {menuError && <div className="alert-message" role="alert">{menuError} <button className="retry-menu-button" type="button" onClick={loadMenu}>Retry</button></div>}
            {error && <div className="alert-message" role="alert">{error}</div>}
            {loading ? (
              <div className="loading-state">Getting the good stuff ready...</div>
            ) : menuError ? (
              <div className="empty-menu"><span>🔌</span><h3>Menu is temporarily unavailable</h3><p>Start the API server, then retry to load the menu.</p></div>
            ) : visibleMenu.length ? (
              <div className="menu-grid">
                {visibleMenu.map((item) => (
                  <article className="food-card" key={item.id}>
                    <div className="food-image-wrap">
                      <img src={item.image} alt={item.name} className="food-image" loading="lazy" />
                      <span className="food-tag">{item.tag}</span>
                      <span className="food-rating"><Star size={12} fill="currentColor" /> {item.rating}</span>
                    </div>
                    <div className="food-card-body">
                      <div className="food-title-row"><h3>{item.name}</h3><span className="food-price">{money(item.price)}</span></div>
                      <p>{item.description}</p>
                      <div className="food-card-footer">
                        <span className="food-time"><Clock3 size={14} /> {item.time}</span>
                        {cart[item.id] ? (
                          <div className="quantity-control" aria-label={`${item.name} quantity`}>
                            <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                            <span>{cart[item.id]}</span>
                            <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                          </div>
                        ) : (
                          <button className="add-button" type="button" onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /> Add to cart</button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-menu"><span>🥄</span><h3>Nothing on this plate just yet</h3><p>Try another category or search for something else.</p></div>
            )}
          </div>
          </>}

          {page === "cart" && <aside className="order-panel cart-order-panel" id="your-order">
            {order ? (
              <div className="tracking-content" id="delivery">
                <div className="panel-overline"><span className="live-dot" /> ORDER PLACED</div>
                <div className="tracking-icon"><Truck size={23} /></div>
                <h2>Order placed!</h2>
                <p className="tracking-subtitle">We’ll keep you posted as it travels.</p>
                <p className="order-number">Order #{order.id}</p>
                <div className="eta-card">
                <Clock3 size={17} />
                <span><strong>Estimated arrival</strong><small>{new Date(order.estimatedArrival).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · about {order.estimatedDeliveryMinutes} min</small></span>
                </div>
                <div className="status-badge"><span className="live-dot" /> {order.status}</div>
                <div className="status-timeline">
                {deliverySteps.map((step, index) => {
                  const activeIndex = deliverySteps.indexOf(order.status);
                  const event = order.statusEvents?.find((statusEvent) => statusEvent.status === step);
                  const complete = index < activeIndex;
                  const active = index === activeIndex;
                  return (
                    <div key={step} className={`status-step ${complete ? "complete" : ""} ${active ? "active" : ""}`}>
                      <span className="step-marker">{complete ? <Check size={13} /> : index + 1}</span>
                      <span className="step-copy">{step}{event && <small>{new Date(event.timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</small>}</span>
                    </div>
                  );
                })}
                </div>
                <div className="order-summary">
                  <strong>Your order</strong>
                  {order.items.map((item) => <div className="summary-line" key={item.id}><span>{item.quantity} × {item.name}</span><span>{money(item.price * item.quantity)}</span></div>)}
                  {order.payment && <div className="summary-line"><span>Payment</span><span>{order.payment.method === "upi" ? "UPI payment" : "Cash on delivery"}</span></div>}
                  <div className="summary-line total-line"><span>Order total</span><strong>{money(order.total)}</strong></div>
                </div>
                <button className="new-order-button" type="button" onClick={() => setOrder(null)}>Order something else <ArrowRight size={15} /></button>
              </div>
            ) : (
              <div className="checkout-form" id="delivery">
                <div className="panel-overline">MADE WITH LOVE, FOR YOU</div>
                <div className="checkout-title-row">
                  <h2>{checkoutStep === "cart" ? "Your order" : checkoutStep === "delivery" ? "Delivery details" : "Payment"}</h2>
                  {checkoutStep !== "cart" && <button className="back-step-button" type="button" onClick={() => setCheckoutStep(checkoutStep === "payment" ? "delivery" : "cart")}><ArrowLeft size={14} /> Back</button>}
                </div>
                {checkoutStep === "cart" && cartItems.length ? (
                  <div className="cart-items">
                    {cartItems.map((item) => (
                      <div className="cart-item" key={item.id}>
                        <img src={item.image} alt="" />
                        <div className="cart-item-copy"><strong>{item.name}</strong><span>{money(item.price)}</span></div>
                        <div className="mini-quantity">
                          <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)}><Minus size={12} /></button>
                          <span>{item.quantity}</span>
                          <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, 1)}><Plus size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : checkoutStep === "cart" ? (
                  <div className="cart-empty"><span className="empty-bag"><ShoppingBag size={21} /></span><span>Your cart is waiting<br />for something delicious.<br /><a className="cart-back-to-menu" href="/menu" onClick={(event) => handleNavigation(event, "/menu")}>Browse the menu <ArrowRight size={14} /></a></span></div>
                ) : null}
                <div className="price-breakdown">
                  <div><span>Subtotal <span className="item-qty">{itemCount ? `(${itemCount} ${itemCount === 1 ? "item" : "items"})` : ""}</span></span><span>{money(subtotal)}</span></div>
                  <div><span>Delivery</span><span>{itemCount ? money(deliveryFee) : "—"}</span></div>
                  <div className="total-row"><strong>Total</strong><strong>{money(subtotal + deliveryFee)}</strong></div>
                </div>
                {checkoutStep === "delivery" && (
                  <>
                    <div className="checkout-divider" />
                    <div className="delivery-heading"><span className="delivery-icon"><Truck size={17} /></span><div><strong>Where should we bring it?</strong><small>Your order is almost on its way.</small></div></div>
                    <form onSubmit={(event) => { event.preventDefault(); setCheckoutStep("payment"); }}>
                      <label className="form-field"><span>Full name</span><input required aria-label="Full name" autoComplete="name" placeholder="Your name" value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} /></label>
                      <label className="form-field"><span>Delivery address</span><input required aria-label="Delivery address" autoComplete="street-address" placeholder="Street, city, apartment..." value={customer.address} onChange={(event) => updateCustomer("address", event.target.value)} /></label>
                      <label className="form-field"><span>Phone number</span><input required aria-label="Phone number" type="tel" autoComplete="tel" placeholder="(555) 000-0000" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} /></label>
                      {error && <div className="alert-message checkout-error" role="alert">{error}</div>}
                      <button className="place-order-button" type="submit">Continue to payment <ArrowRight size={17} /></button>
                    </form>
                  </>
                )}
                {checkoutStep === "payment" && (
                  <>
                    <div className="checkout-divider" />
                    <div className="delivery-heading"><span className="delivery-icon"><Smartphone size={17} /></span><div><strong>Choose how to pay</strong><small>Complete your order with UPI or cash</small></div></div>
                    <div className="payment-options">
                      <label className={`payment-option ${paymentMethod === "upi" ? "selected" : ""}`}>
                        <input type="radio" name="paymentMethod" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} />
                        <span className="payment-option-icon"><Smartphone size={17} /></span>
                        <span><strong>UPI payment</strong><small>Simulated UPI confirmation · no real payment</small></span>
                        <span className="payment-radio" />
                      </label>
                      <label className={`payment-option ${paymentMethod === "cash-on-delivery" ? "selected" : ""}`}>
                        <input type="radio" name="paymentMethod" value="cash-on-delivery" checked={paymentMethod === "cash-on-delivery"} onChange={() => setPaymentMethod("cash-on-delivery")} />
                        <span className="payment-option-icon"><Truck size={17} /></span>
                        <span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
                        <span className="payment-radio" />
                      </label>
                    </div>
                    <div className="demo-payment-note">UPI is simulated for this demo; no real payment is collected.</div>
                    {error && <div className="alert-message checkout-error" role="alert">{error}</div>}
                    <button className="place-order-button" type="button" onClick={placeOrder} disabled={placingOrder}>
                      {placingOrder ? "Confirming your order..." : <>Confirm order · {money(subtotal + deliveryFee)} <ArrowRight size={17} /></>}
                    </button>
                  </>
                )}
                {checkoutStep === "cart" && (
                  <button className="place-order-button" type="button" onClick={() => setCheckoutStep("delivery")} disabled={!itemCount}>
                    Place order <ArrowRight size={17} />
                  </button>
                )}
                <div className="secure-note"><span>✦</span> Freshly made. Happily delivered.</div>
              </div>
            )}
          </aside>}
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="/menu" onClick={(event) => handleNavigation(event, "/menu")}><span className="brand-mark"><Utensils size={17} /></span><span>mai<span className="brand-period">.</span></span></a>
        <span>Good food, good mood. © 2026 Mai.</span>
        <span className="footer-made"><ChefHat size={15} /> Made fresh, always.</span>
      </footer>
    </div>
  );
}
