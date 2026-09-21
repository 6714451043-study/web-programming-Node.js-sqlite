const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  loadProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
} = require("./storage");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// 📁 Static Files Setup
// ============================================
// ให้ Express อ่านไฟล์ static ทั้งจากโฟลเดอร์ Root และ public
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ============================================
// 🖼 Multer Setup
// ============================================
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `product-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error("ไฟล์ต้องเป็น jpg, png, หรือ webp เท่านั้น"));
    }
  }
});

// ============================================
// Routes
// ============================================

// หน้าหลัก (แก้ปัญหา Cannot GET /)
app.get("/", (req, res) => {
  // ตรวจสอบว่า index.html อยู่ใน public หรือ root
  const publicIndexPath = path.join(__dirname, "public", "index.html");
  if (fs.existsSync(publicIndexPath)) {
    res.sendFile(publicIndexPath);
  } else {
    res.sendFile(path.join(__dirname, "index.html"));
  }
});

app.get("/api/products", (req, res) => {
  res.json(loadProducts());
});

app.get("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = getProductById(id);
  if (!product) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });
  res.json(product);
});

// POST with image upload
app.post("/api/products", upload.single("image"), (req, res) => {
  try {
    const { name, producer, price, category, contact } = req.body;

    if (!name || !producer || !price || !category) {
      return res.status(400).json({
        error: "กรุณาระบุ name, producer, price, category"
      });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const newProduct = addProduct({
      name,
      producer,
      price: Number(price),
      category,
      contact,
      image_path: imagePath
    });

    res.status(201).json(newProduct);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE
app.delete("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const product = getProductById(id);
  if (!product) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });

  if (product.image_path) {
    const cleanPath = product.image_path.replace(/^\//, "");
    const filePath = path.join(__dirname, "public", cleanPath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ ลบไฟล์รูปภาพสำเร็จ: ${filePath}`);
    } else {
      console.log(`⚠️ ไม่พบไฟล์รูปภาพที่จะลบ: ${filePath}`);
    }
  }

  deleteProduct(id);
  res.json({ message: "ลบสำเร็จ", deleted: product });
});

// PUT (Update)
app.put("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, producer, price, category, contact } = req.body;

  const existingProduct = getProductById(id);
  if (!existingProduct) return res.status(404).json({ error: "ไม่พบผลิตภัณฑ์" });

  if (!name || !producer || !price || !category) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  const updated = updateProduct(id, {
    name,
    producer,
    price: Number(price),
    category,
    contact,
    image_path: existingProduct.image_path
  });

  res.json(updated);
});

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});