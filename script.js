// ============================================
// script.js — GitHub Pages (sql.js + Base64 Image Support)
// ============================================

let db = null;

// ----------------------------------------------------
// โหลด sql.js และไฟล์ database.sqlite
// ----------------------------------------------------
async function initDatabase() {
  if (db) return db;

  const config = {
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${filename}`
  };

  const SQL = await initSqlJs(config);
  
  // โหลดไฟล์ database.sqlite จาก Repository
  const response = await fetch("./database.sqlite");
  if (!response.ok) throw new Error("ไม่พบไฟล์ database.sqlite บน Server");
  
  const buf = await response.arrayBuffer();
  db = new SQL.Database(new Uint8Array(buf));
  return db;
}

// ฟังก์ชันแปลงไฟล์รูปภาพเป็น Base64
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// ----------------------------------------------------
// ดึงรายการสินค้ามาแสดงผล
// ----------------------------------------------------
async function loadProducts() {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "<p style='text-align:center; width: 100%;'>กำลังโหลดข้อมูล...</p>";

  try {
    const database = await initDatabase();
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
// ฟอร์มเพิ่มสินค้า (บันทึกรูป Base64 ลง SQLite)
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  const addForm = document.getElementById("add-product-form") || document.querySelector("form");
  if (addForm) {
    addForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // ป้องกันหน้าเว็บ Refresh

      const name = document.getElementById("product-name")?.value || "";
      const producer = document.getElementById("product-producer")?.value || "";
      const price = Number(document.getElementById("product-price")?.value || 0);
      const category = document.getElementById("product-category")?.value || "";
      const contact = document.getElementById("product-contact")?.value || "";
      const fileInput = document.getElementById("product-image") || document.querySelector('input[type="file"]');

      let imagePath = "";

      try {
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          if (file.size > 2 * 1024 * 1024) {
            alert("⚠️ กรุณาเลือกรูปภาพขนาดไม่เกิน 2 MB");
            return;
          }
          imagePath = await convertFileToBase64(file);
        }

        const database = await initDatabase();
        database.run(
          `INSERT INTO products (name, producer, price, category, contact, image_path) VALUES (?, ?, ?, ?, ?, ?)`,
          [name, producer, price, category, contact, imagePath]
        );

        addForm.reset();
        await loadProducts();
        alert("✅ เพิ่มผลิตภัณฑ์และอัปโหลดรูปสำเร็จ!");
      } catch (error) {
        alert("❌ เกิดข้อผิดพลาด: " + error.message);
      }
    });
  }
});
