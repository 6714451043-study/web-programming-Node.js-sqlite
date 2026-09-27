// ==========================================
// 1. ตั้งค่า Cloudinary
// ==========================================
const CLOUD_NAME = 'emogxgbt'; 
const UPLOAD_PRESET = 't94hnrgi';

// Elements จาก index.html
const addForm = document.getElementById('add-product-form');
const productsContainer = document.getElementById('products-container');

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const modalCloseBtn = document.getElementById('modal-close');
const cancelBtn = document.getElementById('cancel-btn');

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
    return data.secure_url;
}

// ==========================================
// 3. ฟังก์ชันแสดงรายการสินค้า
// ==========================================
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    if (!productsContainer) return;

    productsContainer.innerHTML = ''; // เคลียร์ของเก่า

    if (products.length === 0) {
        productsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #777;">ยังไม่มีรายการสินค้า</p>';
        return;
    }

    products.forEach((item, index) => {
        const cardHtml = `
            <div class="card" style="background: #fff; border-radius: 12px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                    <h3 style="margin: 12px 0 5px; color: #333; font-size: 18px;">${item.name}</h3>
                    <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>ผู้ผลิต:</strong> ${item.producer || '-'}</p>
                    <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>หมวดหมู่:</strong> ${item.category || '-'}</p>
                    <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>เบอร์ติดต่อ:</strong> ${item.contact || '-'}</p>
                    <p style="color: #e67e22; font-weight: bold; font-size: 20px; margin: 8px 0;">฿ ${item.price}</p>
                </div>
                
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button onclick="openEditModal(${index})" style="flex: 1; background: #f39c12; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">✏️ ดู/แก้ไข</button>
                    <button onclick="deleteProduct(${index})" style="flex: 1; background: #e74c3c; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer;">🗑️ ลบ</button>
                </div>
            </div>
        `;
        productsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

// ==========================================
// 4. ฟังก์ชันเพิ่มสินค้าใหม่ (Submit Form)
// ==========================================
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('product-image');
        const submitBtn = addForm.querySelector('button[type="submit"]');

        if (!fileInput || !fileInput.files[0]) {
            alert('กรุณาเลือกรูปภาพผลิตภัณฑ์');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
            alert('กำลังอัปโหลดรูปภาพ กรุณารอสักครู่...');
            const imageUrl = await uploadToCloudinary(fileInput.files[0]);

            const newProduct = {
                id: Date.now(),
                name: document.getElementById('product-name').value,
                producer: document.getElementById('product-producer').value,
                price: document.getElementById('product-price').value,
                category: document.getElementById('product-category').value,
                contact: document.getElementById('product-contact').value,
                image: imageUrl
            };

            const products = JSON.parse(localStorage.getItem('products')) || [];
            products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(products));

            alert('เพิ่มผลิตภัณฑ์เรียบร้อยแล้ว!');
            addForm.reset();
            loadProducts();

        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// ==========================================
// 5. ฟังก์ชันจัดการ Edit Modal (เปิด/ปิด/บันทึก พร้อมแก้ไขรูปภาพ)
// ==========================================
function openEditModal(index) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const item = products[index];

    document.getElementById('edit-id').value = index;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-producer').value = item.producer || '';
    document.getElementById('edit-price').value = item.price;
    document.getElementById('edit-category').value = item.category || 'อาหาร/อุปกรณ์สัตว์เลี้ยง';
    document.getElementById('edit-contact').value = item.contact || '';

    // แสดงรูปปัจจุบันใน พรีวิว
    const previewImg = document.getElementById('edit-preview-img');
    if (previewImg) previewImg.src = item.image || '';

    // ล้างค่าช่องเลือกรูปภาพใหม่
    const editFileInput = document.getElementById('edit-image');
    if (editFileInput) editFileInput.value = '';

    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
}

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeEditModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const index = document.getElementById('edit-id').value;
        let products = JSON.parse(localStorage.getItem('products')) || [];

        const submitBtn = editForm.querySelector('button[type="submit"]');
        const editFileInput = document.getElementById('edit-image');

        // ค่ารูปภาพเริ่มต้นเป็นรูปเดิม
        let imageUrl = products[index].image;

        // เช็คว่าผู้ใช้เลือกรูปภาพใหม่หรือไม่
        if (editFileInput && editFileInput.files[0]) {
            if (submitBtn) submitBtn.disabled = true;
            try {
                alert('กำลังอัปโหลดรูปภาพใหม่ กรุณารอสักครู่...');
                imageUrl = await uploadToCloudinary(editFileInput.files[0]);
            } catch (err) {
                console.error(err);
                alert('อัปโหลดรูปภาพใหม่ไม่สำเร็จ');
                if (submitBtn) submitBtn.disabled = false;
                return;
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        }

        // อัปเดตข้อมูลทั้งหมดลงใน Object
        products[index].name = document.getElementById('edit-name').value;
        products[index].producer = document.getElementById('edit-producer').value;
        products[index].price = document.getElementById('edit-price').value;
        products[index].category = document.getElementById('edit-category').value;
        products[index].contact = document.getElementById('edit-contact').value;
        products[index].image = imageUrl; // บันทึกรูปใหม่ (หรือรูปเดิมถ้าไม่เลือกใหม่)

        localStorage.setItem('products', JSON.stringify(products));
        alert('อัปเดตข้อมูลผลิตภัณฑ์เรียบร้อย!');
        closeEditModal();
        loadProducts();
    });
}

// ==========================================
// 6. ฟังก์ชันลบสินค้า
// ==========================================
function deleteProduct(index) {
    if (confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
        let products = JSON.parse(localStorage.getItem('products')) || [];
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
    }
}

// โหลดรายการสินค้าเมื่อเปิดหน้าเว็บ
document.addEventListener('DOMContentLoaded', loadProducts);
