const API_BASE = "http://127.0.0.1:3000/api";

let cart = [];
let allMenuItems = [];
let searchDebounceTimer = null;

function getFoodEmoji(name) {
  if (name.includes("กุ้ง") || name.includes("ต้มยำ")) return "🦐";
  if (name.includes("ไก่") || name.includes("สเต็ก")) return "🍗";
  if (name.includes("หมู") || name.includes("กะเพรา") || name.includes("ขาหมู"))
    return "🥩";
  if (name.includes("ชา") || name.includes("กาแฟ") || name.includes("น้ำ"))
    return "🥤";
  if (
    name.includes("ก๋วยเตี๋ยว") ||
    name.includes("สุกี้") ||
    name.includes("ผัดไทย")
  )
    return "🍜";
  if (name.includes("บิงซู") || name.includes("ขนม") || name.includes("ผลไม้"))
    return "🍧";
  if (name.includes("ส้มตำ") || name.includes("ยำ") || name.includes("ลาบ"))
    return "🥗";
  return "🍱";
}

function getStatusBadge(status) {
  switch (status) {
    case "pending":
      return '<span class="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold"><i class="fa-regular fa-clock mr-1"></i> pending (รอดำเนินการ)</span>';
    case "preparing":
      return '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold"><i class="fa-solid fa-fire-burner mr-1"></i> preparing (กำลังปรุง)</span>';
    case "delivered":
    case "completed":
      return '<span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold"><i class="fa-solid fa-circle-check mr-1"></i> delivered (จัดส่งแล้ว)</span>';
    case "cancelled":
      return '<span class="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold"><i class="fa-solid fa-ban mr-1"></i> cancelled (ยกเลิก)</span>';
    default:
      return `<span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">${status}</span>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkApiHealth();
  loadMenu();
});

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  let bgColor = "bg-slate-800 text-white";
  let icon = "fa-circle-info";

  if (type === "success") {
    bgColor = "bg-emerald-600 text-white";
    icon = "fa-circle-check";
  } else if (type === "error") {
    bgColor = "bg-rose-600 text-white";
    icon = "fa-triangle-exclamation";
  } else if (type === "warning") {
    bgColor = "bg-amber-500 text-white";
    icon = "fa-triangle-exclamation";
  }

  toast.className = `${bgColor} px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium transition-all duration-300 translate-y-2 opacity-0`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.classList.remove("translate-y-2", "opacity-0"), 10);
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function switchTab(tabId) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active-tab");
    btn.classList.add("border-transparent");
  });

  document.getElementById(tabId).classList.remove("hidden");
  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add("active-tab");
    activeBtn.classList.remove("border-transparent");
  }

  if (tabId === "history-tab") loadOrderHistory();
  if (tabId === "add-menu-tab") loadAdminMenuList();
  if (tabId === "report-tab") loadReport();
}

async function checkApiHealth() {
  const badge = document.getElementById("api-status-badge");
  try {
    const res = await fetch(`${API_BASE}/test/health`);
    if (res.ok) {
      badge.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-300"></i> <span>ออนไลน์ (Port 3000)</span>`;
      badge.className =
        "flex items-center gap-2 bg-emerald-700/80 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 text-emerald-100";
    } else throw new Error();
  } catch (err) {
    badge.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-300"></i> <span>เชื่อมต่อไม่สำเร็จ</span>`;
    badge.className =
      "flex items-center gap-2 bg-rose-800/80 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 text-rose-100";
  }
}

function debounceLoadMenu() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => loadMenu(), 300);
}

// GET /api/foods
async function loadMenu() {
  const grid = document.getElementById("menu-grid");
  const search = document.getElementById("search-input").value.trim();
  const minPrice = document.getElementById("min-price").value;
  const maxPrice = document.getElementById("max-price").value;
  const available = document.getElementById("available-filter").value;

  grid.innerHTML = `<div class="col-span-2 text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100"><i class="fa-solid fa-spinner fa-spin text-3xl text-amber-500 mb-3"></i><p class="text-slate-400 text-sm">กำลังโหลดข้อมูลรายการอาหาร...</p></div>`;

  try {
    let params = new URLSearchParams();
    if (search) params.append("search", search);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (available !== "") params.append("available", available);

    const res = await fetch(`${API_BASE}/foods?${params.toString()}`);
    const result = await res.json();

    if (result.success && result.data) {
      allMenuItems = result.data;
      updateOverviewStats(result.data);

      if (result.data.length === 0) {
        grid.innerHTML = `<div class="col-span-2 text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100"><i class="fa-solid fa-magnifying-glass text-4xl text-slate-300 mb-2"></i><p class="text-slate-500 font-medium">ไม่พบรายการอาหารตามเงื่อนไขที่ค้นหา</p></div>`;
        return;
      }

      grid.innerHTML = result.data
        .map((item) => {
          const isAvailable = Boolean(item.available);
          const emoji = getFoodEmoji(item.name);
          return `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-200 transition flex flex-col justify-between group">
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">${emoji}</div>
                            <div>
                                <h3 class="font-bold text-slate-800 text-sm leading-snug">${item.name}</h3>
                                <p class="text-orange-600 font-extrabold text-base mt-0.5">${Number(item.price).toFixed(2)} <span class="text-xs font-normal">฿</span></p>
                            </div>
                        </div>
                        <span class="text-[10px] px-2.5 py-1 rounded-full font-semibold ${isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}">
                            ${isAvailable ? "พร้อมจำหน่าย" : "สินค้าหมด"}
                        </span>
                    </div>
                    <div class="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <span class="text-xs text-slate-400">รหัสเมนู: #${item.id}</span>
                        <button onclick="addToCart(${item.id}, '${item.name}', ${item.price})" ${!isAvailable ? "disabled" : ""}
                                class="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-3.5 py-1.5 rounded-xl transition shadow-sm active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1.5">
                            <i class="fa-solid fa-plus"></i> เพิ่มในตะกร้า
                        </button>
                    </div>
                </div>`;
        })
        .join("");
    }
  } catch (err) {
    grid.innerHTML = `<div class="col-span-2 text-center py-12 bg-white text-rose-500"><p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}</p></div>`;
  }
}

function updateOverviewStats(menuList) {
  document.getElementById("stat-total-items").textContent = menuList.length;
  document.getElementById("stat-available-items").textContent = menuList.filter(
    (i) => i.available,
  ).length;
}

// ================= POST /api/foods (เพิ่มเมนูใหม่) =================
async function submitNewMenu(e) {
  e.preventDefault();

  const name = document.getElementById("new-menu-name").value.trim();
  const price = document.getElementById("new-menu-price").value;
  const available =
    document.getElementById("new-menu-available").value === "true";

  if (!name || !price) {
    showToast("กรุณากรอกข้อมูลให้ครบถ้วน", "warning");
    return;
  }

  const payload = { name, price: Number(price), available };

  try {
    const res = await fetch(`${API_BASE}/foods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`เพิ่มเมนู "${name}" เรียบร้อยแล้ว!`, "success");
      document.getElementById("add-menu-form").reset();
      loadAdminMenuList();
      loadMenu(); // reload front menu too
    } else {
      showToast(`เพิ่มไม่สำเร็จ: ${data.message || "เกิดข้อผิดพลาด"}`, "error");
    }
  } catch (err) {
    showToast(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${err.message}`, "error");
  }
}

// Load Admin Menu List Table
async function loadAdminMenuList() {
  const tbody = document.getElementById("admin-menu-table-body");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl text-amber-500 mr-2"></i>กำลังโหลดรายการ...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/foods`);
    const result = await res.json();

    if (result.success && result.data) {
      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">ยังไม่มีเมนูในระบบ</td></tr>`;
        return;
      }

      tbody.innerHTML = result.data
        .map((item) => {
          const isAvail = Boolean(item.available);
          return `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-4 font-mono font-medium text-xs text-slate-500">#${item.id}</td>
                    <td class="p-4 font-bold text-slate-800">
                        <span class="mr-2">${getFoodEmoji(item.name)}</span>${item.name}
                    </td>
                    <td class="p-4 text-orange-600 font-bold">${Number(item.price).toFixed(2)} ฿</td>
                    <td class="p-4 text-center">
                        <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${isAvail ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}">
                            ${isAvail ? "พร้อมขาย" : "สินค้าหมด"}
                        </span>
                    </td>
                    <td class="p-4 text-center space-x-2">
                        <button onclick="toggleFoodStatus(${item.id}, ${isAvail})" title="เปลี่ยนสถานะ" class="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium">
                            <i class="fa-solid fa-arrows-rotate mr-1"></i> ${isAvail ? "ตั้งเป็นหมด" : "ตั้งเป็นพร้อมขาย"}
                        </button>
                        <button onclick="deleteMenuItem(${item.id}, '${item.name}')" title="ลบเมนู" class="text-xs px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition font-medium">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </td>
                </tr>`;
        })
        .join("");
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-rose-500 text-xs">โหลดไม่สำเร็จ: ${err.message}</td></tr>`;
  }
}

// Toggle food status (PUT /api/foods/:id)
async function toggleFoodStatus(id, currentStatus) {
  try {
    const res = await fetch(`${API_BASE}/foods/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !currentStatus }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("อัปเดตสถานะสินค้าเรียบร้อย", "success");
      loadAdminMenuList();
      loadMenu();
    } else {
      showToast(`อัปเดตไม่สำเร็จ: ${data.message}`, "error");
    }
  } catch (err) {
    showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  }
}

// Delete food item (DELETE /api/foods/:id)
async function deleteMenuItem(id, name) {
  if (!confirm(`คุณต้องการลบเมนู "${name}" ใช่หรือไม่?`)) return;

  try {
    const res = await fetch(`${API_BASE}/foods/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`ลบเมนู "${name}" เรียบร้อย`, "success");
      loadAdminMenuList();
      loadMenu();
    } else {
      showToast(`ลบไม่สำเร็จ: ${data.message}`, "error");
    }
  } catch (err) {
    showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  }
}

// Cart Operations
function addToCart(id, name, price) {
  const existing = cart.find((item) => item.menu_item_id === id);
  if (existing) existing.quantity += 1;
  else cart.push({ menu_item_id: id, name, price: Number(price), quantity: 1 });
  showToast(`เพิ่ม "${name}" เข้าตะกร้าแล้ว`, "success");
  renderCart();
}

function updateQuantity(id, delta) {
  const item = cart.find((i) => i.menu_item_id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) cart = cart.filter((i) => i.menu_item_id !== id);
  }
  renderCart();
}

function clearCart() {
  if (cart.length === 0) return;
  cart = [];
  renderCart();
  showToast("ล้างข้อมูลตะกร้าสินค้าแล้ว", "info");
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const totalPriceEl = document.getElementById("cart-total-price");
  const totalQtyEl = document.getElementById("cart-total-qty");
  const submitBtn = document.getElementById("btn-submit");

  if (cart.length === 0) {
    container.innerHTML = `<div class="text-center py-8"><i class="fa-solid fa-cart-flatbed text-4xl text-slate-200 mb-2"></i><p class="text-slate-400 text-xs">ยังไม่มีรายการอาหารในตะกร้า</p></div>`;
    totalPriceEl.textContent = "0.00 ฿";
    totalQtyEl.textContent = "0 ชิ้น";
    submitBtn.disabled = true;
    document.getElementById("stat-cart-count").textContent = "0 รายการ";
    document.getElementById("stat-cart-total").textContent = "0.00 ฿";
    return;
  }

  let grandTotal = 0,
    totalQty = 0;
  container.innerHTML = cart
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      grandTotal += itemTotal;
      totalQty += item.quantity;
      return `
            <div class="pt-2 flex items-center justify-between gap-2">
                <div class="flex-1">
                    <h4 class="text-xs font-semibold text-slate-800">${item.name}</h4>
                    <p class="text-[11px] text-slate-400">${item.price.toFixed(2)} x ${item.quantity} = <strong class="text-orange-600 font-medium">${itemTotal.toFixed(2)} ฿</strong></p>
                </div>
                <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button type="button" onclick="updateQuantity(${item.menu_item_id}, -1)" class="w-5 h-5 bg-white rounded text-xs font-bold font-mono">-</button>
                    <span class="w-6 text-center text-xs font-bold text-slate-700">${item.quantity}</span>
                    <button type="button" onclick="updateQuantity(${item.menu_item_id}, 1)" class="w-5 h-5 bg-white rounded text-xs font-bold font-mono">+</button>
                </div>
            </div>`;
    })
    .join("");

  totalPriceEl.textContent = `${grandTotal.toFixed(2)} ฿`;
  totalQtyEl.textContent = `${totalQty} ชิ้น`;
  submitBtn.disabled = false;
  document.getElementById("stat-cart-count").textContent =
    `${cart.length} รายการ`;
  document.getElementById("stat-cart-total").textContent =
    `${grandTotal.toFixed(2)} ฿`;
}

// POST /api/orders
async function submitOrder(e) {
  e.preventDefault();
  const customerName = document.getElementById("customer-name").value.trim();
  if (!customerName || cart.length === 0) return;

  const payload = {
    customer_name: customerName,
    items: cart.map((item) => ({
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
    })),
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(
        `สั่งซื้อเรียบร้อย! Order ID #${data.data.order_id}`,
        "success",
      );
      cart = [];
      document.getElementById("customer-name").value = "";
      renderCart();
    } else showToast(`ไม่สามารถสร้างคำสั่งซื้อได้: ${data.message}`, "error");
  } catch (err) {
    showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  }
}

// GET /api/orders
async function loadOrderHistory() {
  const historyContainer = document.getElementById("history-list");
  const filterStatus = document.getElementById("history-status-filter").value;

  historyContainer.innerHTML = `<div class="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100"><i class="fa-solid fa-spinner fa-spin text-3xl text-amber-500 mb-3"></i><p class="text-slate-400 text-sm">กำลังโหลดประวัติคำสั่งซื้อ...</p></div>`;

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const result = await res.json();

    if (result.success && result.data) {
      let orders = result.data;
      if (filterStatus) {
        orders = orders.filter((o) => o.status === filterStatus);
      }

      if (orders.length === 0) {
        historyContainer.innerHTML = `
                    <div class="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <i class="fa-solid fa-receipt text-4xl text-slate-300 mb-2"></i>
                        <p class="text-slate-500 font-medium">ยังไม่มีประวัติคำสั่งซื้อในระบบ</p>
                    </div>`;
        return;
      }

      historyContainer.innerHTML = orders
        .map((order) => {
          const dateStr = new Date(order.created_at).toLocaleString("th-TH");
          const badge = getStatusBadge(order.status);
          const totalPrice = Number(order.total_price || 0).toFixed(2);

          const itemsHtml = (order.items || [])
            .map(
              (i) => `
                    <div class="flex justify-between items-center text-xs py-1 border-b border-slate-50 last:border-0">
                        <span>${getFoodEmoji(i.name)} <strong>${i.name}</strong> x ${i.quantity}</span>
                        <span class="text-slate-500">${(Number(i.price) * i.quantity).toFixed(2)} ฿</span>
                    </div>
                `,
            )
            .join("");

          return `
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3 hover:shadow-md transition">
                        <div class="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
                            <div class="flex items-center gap-3">
                                <span class="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-lg">Order #${order.order_id}</span>
                                <h3 class="font-bold text-slate-800 text-sm"><i class="fa-solid fa-user text-slate-400 mr-1"></i> ${order.customer_name}</h3>
                            </div>
                            <div class="flex items-center gap-3">
                                ${badge}
                                <span class="text-xs text-slate-400"><i class="fa-regular fa-calendar mr-1"></i> ${dateStr}</span>
                            </div>
                        </div>

                        <div class="bg-slate-50 p-3 rounded-xl space-y-1">
                            <p class="text-xs font-semibold text-slate-500 mb-1">รายการอาหารที่สั่ง:</p>
                            ${itemsHtml || '<p class="text-xs text-slate-400">ไม่มีรายการย่อย</p>'}
                        </div>

                        <div class="flex justify-between items-center pt-1 text-sm">
                            <span class="text-xs text-slate-500">ราคารวมออเดอร์นี้:</span>
                            <span class="font-extrabold text-orange-600 text-base">${totalPrice} ฿</span>
                        </div>
                    </div>`;
        })
        .join("");
    }
  } catch (err) {
    historyContainer.innerHTML = `<div class="text-center py-12 bg-white text-rose-500"><p>เกิดข้อผิดพลาด: ${err.message}</p></div>`;
  }
}

// PUT /api/orders/:id/status
async function updateOrderStatus(e) {
  e.preventDefault();
  const orderId = document.getElementById("update-order-id").value;
  const status = document.getElementById("update-status-val").value;

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(
        `อัปเดตคำสั่งซื้อ #${orderId} เป็น "${status}" สำเร็จ`,
        "success",
      );
    } else showToast(`อัปเดตไม่สำเร็จ: ${data.message}`, "error");
  } catch (err) {
    showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  }
}

// GET /api/reports/sales
async function loadReport() {
  const tbody = document.getElementById("report-table-body");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i><p class="text-xs">กำลังโหลดรายงานสรุปยอดขาย...</p></td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/reports/sales`);
    const result = await res.json();
    if (result.success && result.data) {
      if (result.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-slate-400">ยังไม่มีข้อมูลยอดขาย</td></tr>`;
        return;
      }
      tbody.innerHTML = result.data
        .map(
          (row) => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="p-4 font-mono font-medium text-xs">#${row.menu_item_id}</td>
                    <td class="p-4 font-bold text-slate-800"><span class="mr-2">${getFoodEmoji(row.menu_name)}</span>${row.menu_name}</td>
                    <td class="p-4 text-slate-600">${Number(row.price).toFixed(2)} ฿</td>
                    <td class="p-4 text-center"><span class="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">${row.total_quantity_sold || row.total_units_sold || 0} ชิ้น</span></td>
                    <td class="p-4 text-right font-extrabold text-emerald-600 text-base">${Number(row.total_revenue).toFixed(2)} ฿</td>
                </tr>`,
        )
        .join("");
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-rose-500 text-xs">เกิดข้อผิดพลาดในการโหลดรายงาน: ${err.message}</td></tr>`;
  }
}
