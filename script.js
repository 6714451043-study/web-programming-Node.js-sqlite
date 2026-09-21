// ============================================
// script.js — OTOP Frontend (sql.js / GitHub Pages Version)
// ============================================

let db = null; // ตัวแปรสำหรับเก็บการเชื่อมต่อ Database

// ----------------------------------------------------
// โหลด sql.js และไฟล์ database.sqlite
// ----------------------------------------------------
async function initDatabase() {
  if (db) return db;

  const config = {
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`
  };

  const SQL = await initSqlJs(config);
  
  // ดึงไฟล์ database.sqlite จาก Repository บน GitHub Pages
  const response = await fetch("database.sqlite");
  if (!response.ok) throw new Error("ไม่พบไฟล์ database.sqlite บน Server");
  
  const buf = await response.arrayBuffer();
  db = new SQL.Database(new Uint8Array(buf));
  return db;
}

// ----------------------------------------------------
// ดึงรายการสินค้าทั้งหมดมาแสดงผล
// ----------------------------------------------------
async function loadProducts() {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center; width: 100%;'>กำลังโหลดข้อมูลจาก SQLite...</p>";

  try {
    const database = await initDatabase();
    
    // คิวรีข้อมูลจากตาราง products (ตรงตามโครงสร้างเดิม)
    const stmt = database.prepare("SELECT * FROM products ORDER BY id DESC");
    const products = [];

    while (stmt.step()) {
      products.push(stmt.getAsObject());
    }
    stmt.free();

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
            <img src="${product.image_path}" 
             alt="${product.name}" 
             onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=No+Image';">
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
            <span class="price">฿ ${Number(product.price).toLocaleString()}</span>
            <div class="card-actions">
              <button class="edit-btn" data-id="${product.id}">✏️ ดูข้อมูล</button>
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
// Event Delegation สำหรับปุ่ม ดูข้อมูล และ ลบ
// ----------------------------------------------------
const productsContainer = document.getElementById("products-container");
if (productsContainer) {
  productsContainer.addEventListener("click", async (event) => {
    // ปุ่มดูข้อมูล / แก้ไข
    if (event.target.classList.contains("edit-btn")) {
      const id = Number(event.target.dataset.id);
      try {
        const database = await initDatabase();
        const stmt = database.prepare("SELECT * FROM products WHERE id = :id");
        const product = stmt.getAsObject({ ":id": id });
        stmt.free();

        if (product && product.id) {
          openEditModal(product);
        } else {
          throw new Error("ไม่พบรายการนี้");
        }
      } catch (err) {
        alert("❌ ไม่สามารถดึงข้อมูลสินค้าได้: " + err.message);
      }
    }

    // ปุ่มลบ (ลบชั่วคราวในความจำเบราว์เซอร์)
    if (event.target.classList.contains("delete-btn")) {
      const id = Number(event.target.dataset.id);
      const card = event.target.closest(".card");
      const productName = card ? card.querySelector("h3").textContent : "รายการนี้";

      if (!confirm(`ยืนยันลบ "${productName}"? (ข้อควรระวัง: จะลบเฉพาะบนหน้าเบราว์เซอร์นี้เท่านั้น)`)) return;

      try {
        const database = await initDatabase();
        database.run("DELETE FROM products WHERE id = ?", [id]);
        await loadProducts();
      } catch (error) {
        alert("❌ เกิดข้อผิดพลาด: " + error.message);
      }
    }
  });
}

// ----------------------------------------------------
// ฟอร์มเพิ่มสินค้า (บันทึกชั่วคราวในเบราว์เซอร์)
// ----------------------------------------------------
const addForm = document.getElementById("add-product-form");
if (addForm) {
  addForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("product-name").value;
    const producer = document.getElementById("product-producer").value;
    const price = Number(document.getElementById("product-price").value);
    const category = document.getElementById("product-category").value;
    const contact = document.getElementById("product-contact").value;

    try {
      const database = await initDatabase();
      database.run(
        `INSERT INTO products (name, producer, price, category, contact) VALUES (?, ?, ?, ?, ?)`,
        [name, producer, price, category, contact]
      );

      addForm.reset();
      await loadProducts();
      alert("✅ เพิ่มผลิตภัณฑ์สำเร็จ (ข้อมูลจะบันทึกชั่วคราวในหน้าเว็บนี้)");
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
    const name = document.getElementById("edit-name").value;
    const producer = document.getElementById("edit-producer").value;
    const price = Number(document.getElementById("edit-price").value);
    const category = document.getElementById("edit-category").value;
    const contact = document.getElementById("edit-contact").value || null;

    try {
      const database = await initDatabase();
      database.run(
        `UPDATE products SET name = ?, producer = ?, price = ?, category = ?, contact = ? WHERE id = ?`,
        [name, producer, price, category, contact, id]
      );

      closeEditModal();
      await loadProducts();
      alert("✅ บันทึกสำเร็จ");
    } catch (error) {
      alert("❌ " + error.message);
    }
  });
}
// ฟังก์ชันแปลงไฟล์รูปภาพเป็น Base64 String
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const addForm = document.getElementById("add-product-form");
if (addForm) {
  addForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("product-name").value;
    const producer = document.getElementById("product-producer").value;
    const price = Number(document.getElementById("product-price").value);
    const category = document.getElementById("product-category").value;
    const contact = document.getElementById("product-contact").value;
    const fileInput = document.getElementById("product-image");

    let imagePath = "";

    try {
      // อ่านไฟล์รูปแล้วแปลงเป็น Base64
      if (fileInput && fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        
        // เช็กขนาดไฟล์ ไม่ให้เกิน 2MB
        if (file.size > 2 * 1024 * 1024) {
          alert("⚠️ กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 2 MB");
          return;
        }

        imagePath = await convertFileToBase64(file);
      }

      // บันทึกข้อความ Base64 ลงใน SQLite
      const database = await initDatabase();
      database.run(
        `INSERT INTO products (name, producer, price, category, contact, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, producer, price, category, contact, imagePath]
      );

      addForm.reset();
      await loadProducts();
      alert("✅ เพิ่มผลิตภัณฑ์สำเร็จ!");
    } catch (error) {
      alert("❌ เกิดข้อผิดพลาด: " + error.message);
    }
  });
}
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
