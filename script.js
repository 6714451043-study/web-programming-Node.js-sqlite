// ==========================================
// 1. ตั้งค่า Cloudinary (ใส่ข้อมูลของคุณตรงนี้)
// ==========================================
const CLOUD_NAME = 'emogxgbt'; 
const UPLOAD_PRESET = 't94hnrgi';

// Elements
const productForm = document.querySelector('form'); // หรือ id ของ form เช่น document.getElementById('product-form')
const fileInput = document.querySelector('input[type="file"]');
const container = document.querySelector('.product-list') || document.body; // ปรับ selector ให้ตรงกับ container แสดงสินค้าใน HTML

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
    
    // ค้นหาตำแหน่งที่จะแสดงสินค้าในหน้า HTML (ปรับให้ตรงกับโครงสร้าง HTML ของคุณ)
    const productGrid = document.querySelector('#product-container') || container;
    
    // เคลียร์การแสดงผลเดิม
    // (หากมีส่วนแผงควบคุม ให้คงไว้ แล้วเคลียร์เฉพาะการ์ดสินค้า)
    const cards = productGrid.querySelectorAll('.product-card');
    cards.forEach(card => card.remove());

    // สร้างการ์ดสินค้าแสดงผล
    products.forEach((item, index) => {
        const cardHtml = `
            <div class="product-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px; border-radius: 8px; max-width: 300px;">
                <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 5px;">
                <h3>${item.name}</h3>
                <p>หมวดหมู่: ${item.category || '-'}</p>
                <p>เบอร์ติดต่อ: ${item.phone || '-'}</p>
                <p style="color: #e67e22; font-weight: bold;">฿ ${item.price}</p>
                <button onclick="deleteProduct(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">ลบ</button>
            </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// ==========================================
// 4. ฟังก์ชันลบสินค้า
// ==========================================
function deleteProduct(index) {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    products.splice(index, 1);
    localStorage.setItem('products', JSON.stringify(products));
    loadProducts();
}

// ==========================================
// 5. Event Listener เมื่อกดปุ่ม "เพิ่มผลิตภัณฑ์"
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

            // ดึงค่าจาก Form (ปรับ selector ตาม name/id ใน HTML ของคุณ)
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
