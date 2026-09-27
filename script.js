// ==========================================
// 1. ตั้งค่า Cloudinary
// ==========================================
const CLOUD_NAME = 'emogxgbt'; 
const UPLOAD_PRESET = 't94hnrgi';

// Elements
const productForm = document.querySelector('form');
const fileInput = document.querySelector('input[type="file"]');

// ==========================================
// 2. ฟังก์ชันอัปโหลดรูปภาพไป Cloudinary
// ==========================================
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) throw new Error('Upload image failed');
    const data = await res.json();
    return data.secure_url; // ส่งคืน URL ของรูปภาพ
}

// ==========================================
// 3. ฟังก์ชันดึงข้อมูลจาก localStorage มาแสดงผล
// ==========================================
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    
    // ค้นหา Container สำหรับแสดงสินค้าในหน้า HTML เดิม
    // (ลองหาจาก .product-list, #product-container หรือพื้นที่ใต้หัวข้อสินค้าและบริการ)
    let productGrid = document.querySelector('.product-grid') || 
                      document.querySelector('.product-list') || 
                      document.querySelector('#product-container');

    // ถ้ายังหาไม่เจอ ให้สร้าง div container รองรับไว้ใต้หัวข้อ "สินค้าและบริการของเรา"
    if (!productGrid) {
        const headings = document.querySelectorAll('h1, h2, h3');
        let targetHeading = null;
        headings.forEach(h => {
            if (h.textContent.includes('สินค้าและบริการ')) targetHeading = h;
        });

        if (targetHeading) {
            productGrid = document.createElement('div');
            productGrid.className = 'product-grid';
            productGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px 0;';
            targetHeading.insertAdjacentElement('afterend', productGrid);
        } else {
            productGrid = document.body;
        }
    }

    // เคลียร์รายการเดิมออกก่อน
    productGrid.innerHTML = '';

    // วาดการ์ดสินค้าโดยใช้โครงสร้างคลาสตามดีไซน์เดิมของเว็บ
    products.forEach((item, index) => {
        const cardHtml = `
            <div class="product-card" style="background: #fff; border-radius: 12px; padding: 15px; width: 320px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display: inline-block; text-align: left; margin: 10px; vertical-align: top;">
                <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                <h3 style="margin: 12px 0 5px; color: #333; font-size: 18px;">${item.name}</h3>
                <p style="margin: 4px 0; color: #777; font-size: 14px;">หมวดหมู่: ${item.category || '-'}</p>
                <p style="margin: 4px 0; color: #777; font-size: 14px;">เบอร์ติดต่อ: ${item.phone || '-'}</p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="color: #e67e22; font-weight: bold; font-size: 20px;">฿ ${item.price}</span>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="editProduct(${index})" style="background: #f39c12; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">✏️ ดูข้อมูล/แก้ไข</button>
                        <button onclick="deleteProduct(${index})" style="background: #e74c3c; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 14px;">🗑️ ลบ</button>
                    </div>
                </div>
            </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// ==========================================
// 4. ฟังก์ชันลบสินค้า
// ==========================================
function deleteProduct(index) {
    if (confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
    }
}

// ==========================================
// 5. ฟังก์ชันแก้ไขสินค้า (Edit Product)
// ==========================================
function editProduct(index) {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    const item = products[index];

    const newName = prompt('แก้ไขชื่อสินค้า:', item.name);
    if (newName === null) return;

    const newPrice = prompt('แก้ไขราคา (บาท):', item.price);
    if (newPrice === null) return;

    const newPhone = prompt('แก้ไขเบอร์ติดต่อ:', item.phone || '');
    if (newPhone === null) return;

    const newCategory = prompt('แก้ไขหมวดหมู่:', item.category || '');
    if (newCategory === null) return;

    products[index].name = newName || item.name;
    products[index].price = newPrice || item.price;
    products[index].phone = newPhone || item.phone;
    products[index].category = newCategory || item.category;

    localStorage.setItem('products', JSON.stringify(products));
    alert('อัปเดตข้อมูลเรียบร้อยแล้ว!');
    loadProducts();
}
// ==========================================
// 6. Event Listener เมื่อกดปุ่ม "เพิ่มผลิตภัณฑ์"
// ==========================================
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = productForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const file = fileInput.files[0];
            let imageUrl = '';

            if (file) {
                alert('กำลังอัปโหลดรูปภาพ กรุณารอสักครู่...');
                imageUrl = await uploadToCloudinary(file);
            } else {
                alert('กรุณาเลือกรูปภาพ');
                if (submitBtn) submitBtn.disabled = false;
                return;
            }

            // ดึงค่าจาก Form
            const newProduct = {
                id: Date.now(),
                name: productForm.querySelector('input[placeholder*="ชื่อ"]')?.value || 'สินค้าใหม่',
                price: productForm.querySelector('input[type="number"]')?.value || '0',
                phone: productForm.querySelector('input[type="tel"]')?.value || '',
                category: productForm.querySelector('select')?.value || '',
                image: imageUrl
            };

            // บันทึกลง localStorage
            const products = JSON.parse(localStorage.getItem('products')) || [];
            products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(products));

            alert('เพิ่มสินค้าเรียบร้อยแล้ว!');
            productForm.reset();
            loadProducts();

        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// โหลดรายการสินค้าทันทีเมื่อเปิดหน้าเว็บ
document.addEventListener('DOMContentLoaded', loadProducts);
