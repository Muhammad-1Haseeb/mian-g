import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new Database(path.join(__dirname, "restaurant.db"));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
  CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    price INTEGER NOT NULL,
    available INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    table_number TEXT DEFAULT '',
    items_json TEXT NOT NULL,
    total INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'New',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM menu").get().n;
if (!count) {
  const seed = db.prepare("INSERT INTO menu (name,category,description,price) VALUES (?,?,?,?)");
  [
    ["Chicken Karahi","Dinner","Traditional desi chicken karahi",1800],
    ["Mutton Karahi","Dinner","Slow-cooked mutton with house spices",3200],
    ["Lebanese Mutton","Dinner","Our signature mutton speciality",2800],
    ["BBQ Platter","Platters","Assorted barbecue selection",2200],
    ["Chicken Tikka","Dinner","Smoky charcoal-grilled chicken",650],
    ["Tandoori Paratha","Breakfast","Freshly baked tandoori paratha",120],
    ["Omelette","Breakfast","Two-egg desi omelette",180],
    ["Mango Shake","Drinks","Fresh mango shake",300],
    ["Lassi","Drinks","Traditional chilled lassi",180]
  ].forEach(x => seed.run(...x));
}

app.get("/api/menu", (req,res) => {
  const rows = db.prepare("SELECT * FROM menu WHERE available=1 ORDER BY category,name").all();
  res.json(rows);
});

app.post("/api/orders", (req,res) => {
  const { customerName, phone, tableNumber="", items, notes="" } = req.body || {};
  if (!customerName?.trim() || !phone?.trim() || !Array.isArray(items) || !items.length) {
    return res.status(400).json({error:"Name, phone number and at least one menu item are required."});
  }
  const menu = db.prepare("SELECT id,name,price FROM menu WHERE available=1").all();
  let total = 0;
  const cleanItems = [];
  for (const item of items) {
    const product = menu.find(p => p.id === Number(item.id));
    const qty = Math.max(1, Math.min(50, Number(item.qty) || 1));
    if (!product) return res.status(400).json({error:"One of the selected items is unavailable."});
    total += product.price * qty;
    cleanItems.push({id:product.id,name:product.name,price:product.price,qty});
  }
  const result = db.prepare(`INSERT INTO orders
    (customer_name,phone,table_number,items_json,total,notes)
    VALUES (?,?,?,?,?,?)`).run(customerName.trim(),phone.trim(),String(tableNumber),JSON.stringify(cleanItems),total,String(notes));
  res.status(201).json({message:"Order received",orderId:result.lastInsertRowid,total});
});

// Simple admin endpoints: protect these with authentication before public deployment.
app.get("/api/admin/orders", (req,res) => {
  const rows = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 100").all();
  res.json(rows.map(r => ({...r,items:JSON.parse(r.items_json)})));
});
app.patch("/api/admin/orders/:id", (req,res) => {
  const allowed = ["New","Preparing","Ready","Completed","Cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({error:"Invalid status"});
  const result = db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status,req.params.id);
  if (!result.changes) return res.status(404).json({error:"Order not found"});
  res.json({ok:true});
});

app.get("*", (req,res) => res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT, () => console.log(`Restaurant website running at http://localhost:${PORT}`));
