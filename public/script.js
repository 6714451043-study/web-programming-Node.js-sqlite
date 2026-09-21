// ============================================
// script.js — OTOP Frontend (Event Delegation Version)
// ============================================

async function loadProducts() {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center; width: 100%;'>กำลังโหลด...</p>";

  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลจาก Server ได้");
    
    const products = await response.json();

    if (products.length === 0) {
      container.innerHTML = "<p style='text-align:center; width: 100%;'>ยังไม่มีผลิตภัณฑ์</p>";
      return;
    }

    container.innerHTML = "";

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        ${product.image_path ? `
          <div class="card-image">
            <img src="${product.image_path}" alt="${product.name}">
          </div>
        ` : `
          <div class="card-image no-image">
            <span>📸 ไม่มีรูปภาพ</span>
          </div>
        `}
        <div class="card-content">
          <div class="card-header">
            <h3>${product.name}</h3>
            <span class="category-badge">${product.category}</span>
          </div>
          <p class="producer">👥 ${product.producer}</p>
          ${product.contact ? `<p class="contact">📞 ${product.contact}</p>` : ""}
          <div class="card-footer">
            <span class="price">฿ ${product.price.toLocaleString()}</span>
            <div class="card-actions">
              <button class="edit-btn" data-id="${product.id}">✏️ แก้ไข</button>
              <button class="delete-btn" data-id="${product.id}">🗑️ ลบ</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    container.innerHTML = `<p style="color:red; text-align:center; width: 100%;">Error: ${error.message}</p>`;
  }
}

// ----------------------------------------------------
// ดักจับ Event ด้วย Event Delegation (รองรับการคลิกทุกปุ่มชัวร์ 100%)
// ----------------------------------------------------
const productsContainer = document.getElementById("products-container");
if (productsContainer) {
  productsContainer.addEventListener("click", async (event) => {
    // ปุ่มแก้ไข
    if (event.target.classList.contains("edit-btn")) {
      const id = Number(event.target.dataset.id);
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error("ดึงข้อมูลไม่สำเร็จ");
        const product = await response.json();
        openEditModal(product);
      } catch (err) {
        alert("❌ ไม่สามารถดึงข้อมูลสินค้าได้: " + err.message);
      }
    }

    // ปุ่มลบ
    if (event.target.classList.contains("delete-btn")) {
      const id = Number(event.target.dataset.id);
      const card = event.target.closest(".card");
      const productName = card ? card.querySelector("h3").textContent : "รายการนี้";

      if (!confirm(`ยืนยันลบ "${productName}"?`)) return;

      try {
        const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("ลบไม่สำเร็จ");
        await loadProducts();
      } catch (error) {
        alert("❌ เกิดข้อผิดพลาด: " + error.message);
      }
    }
  });
}

// ----------------------------------------------------
// ฟอร์มเพิ่มสินค้า
// ----------------------------------------------------
const addForm = document.getElementById("add-product-form");
if (addForm) {
  addForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("product-name").value);
    formData.append("producer", document.getElementById("product-producer").value);
    formData.append("price", document.getElementById("product-price").value);
    formData.append("category", document.getElementById("product-category").value);
    formData.append("contact", document.getElementById("product-contact").value);

    const fileInput = document.getElementById("product-image");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append("image", fileInput.files[0]);
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("เพิ่มไม่สำเร็จ");

      addForm.reset();
      await loadProducts();
      alert("✅ เพิ่มผลิตภัณฑ์สำเร็จ");
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    }
  });
}

// ----------------------------------------------------
// Modal และฟอร์มแก้ไข
// ----------------------------------------------------
const modal = document.getElementById("edit-modal");
const closeBtn = document.getElementById("modal-close");
const cancelBtn = document.getElementById("cancel-btn");
const editForm = document.getElementById("edit-form");

function openEditModal(product) {
  document.getElementById("edit-id").value = product.id;
  document.getElementById("edit-name").value = product.name;
  document.getElementById("edit-producer").value = product.producer;
  document.getElementById("edit-price").value = product.price;
  document.getElementById("edit-category").value = product.category;
  document.getElementById("edit-contact").value = product.contact || "";

  if (modal) modal.classList.remove("hidden");
}

function closeEditModal() {
  if (modal) modal.classList.add("hidden");
  if (editForm) editForm.reset();
}

if (closeBtn) closeBtn.addEventListener("click", closeEditModal);
if (cancelBtn) cancelBtn.addEventListener("click", closeEditModal);

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeEditModal();
  });
}

if (editForm) {
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = Number(document.getElementById("edit-id").value);
    const updatedData = {
      name: document.getElementById("edit-name").value,
      producer: document.getElementById("edit-producer").value,
      price: Number(document.getElementById("edit-price").value),
      category: document.getElementById("edit-category").value,
      contact: document.getElementById("edit-contact").value || null
    };

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error("แก้ไขไม่สำเร็จ");

      closeEditModal();
      await loadProducts();
      alert("✅ บันทึกสำเร็จ");
    } catch (error) {
      alert("❌ " + error.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});