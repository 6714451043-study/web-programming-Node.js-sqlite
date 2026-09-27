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
    
    // เลือก Element Container ที่ใช้แสดงสินค้า
    const productGrid = document.querySelector('.product-list') || document.querySelector('#product-container') || document.body;
    
    // เคลียร์การ์ดสินค้าเดิม
    const oldCards = productGrid.querySelectorAll('.product-card');
    oldCards.forEach(card => card.remove());

    products.forEach((item, index) => {
        const cardHtml = `
            <div class="product-card" style="border: 1px solid #e0e0e0; padding: 15px; margin: 10px; border-radius: 8px; width: 280px; display: inline-block; vertical-align: top; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;">
                <h3 style="margin: 10px 0 5px; font-size: 18px;">${item.name}</h3>
                <p style="margin: 3px 0; color: #666; font-size: 14px;">หมวดหมู่: ${item.category || '-'}</p>
                <p style="margin: 3px 0; color: #666; font-size: 14px;">เบอร์ติดต่อ: ${item.phone || '-'}</p>
                <p style="color: #d35400; font-weight: bold; font-size: 18px; margin: 8px 0;">฿ ${item.price}</p>
                
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button onclick="editProduct(${index})" style="flex: 1; background: #f39c12; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">ดู/แก้ไข</button>
                    <button onclick="deleteProduct(${index})" style="flex: 1; background: #e74c3c; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">ลบ</button>
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
        products.splice(index, 1); // ลบรายการตามตำแหน่ง index
        localStorage.setItem('products', JSON.stringify(products)); // อัปเดต localStorage
        loadProducts(); // โหลดรายการสินค้าใหม่
    }
}

// ==========================================
// 5. ฟังก์ชันแก้ไขสินค้า (Edit Product)
// ==========================================
function editProduct(index) {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    const item = products[index];

    // รับค่าใหม่จากผู้ใช้ผ่าน Prompt
    const newName = prompt('แก้ไขชื่อสินค้า:', item.name);
    if (newName === null) return; // กด Cancel

    const newPrice = prompt('แก้ไขราคา (บาท):', item.price);
    if (newPrice === null) return;

    const newPhone = prompt('แก้ไขเบอร์ติดต่อ:', item.phone || '');
    if (newPhone === null) return;

    const newCategory = prompt('แก้ไขหมวดหมู่:', item.category || '');
    if (newCategory === null) return;

    // อัปเดตข้อมูล
    products[index].name = newName || item.name;
    products[index].price = newPrice || item.price;
    products[index].phone = newPhone || item.phone;
    products[index].category = newCategory || item.category;

    // บันทึกลง localStorage และรีโหลดรายการ
    localStorage.setItem('products', JSON.stringify(products));
    alert('แก้ไขข้อมูลเรียบร้อยแล้ว!');
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
