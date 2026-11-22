const money = n => "Rs " + Number(n).toLocaleString("en-PK");
let menu = [], cart = [], activeCategory = "All";
const grid = document.getElementById("menuGrid");

async function loadMenu() {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) throw new Error("Menu unavailable");
    menu = await response.json();
    renderMenu();
  } catch {
    grid.innerHTML = '<p class="loading">Could not load the menu. Please refresh the page.</p>';
  }
}
function renderMenu() {
  const visible = activeCategory === "All" ? menu : menu.filter(x => x.category === activeCategory);
  grid.innerHTML = visible.length ? visible.map(item => `
    <article class="menu-card">
      <div class="menu-card-top"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description || "")}</p></div><span class="price">${money(item.price)}</span></div>
      <div class="menu-card-bottom"><span class="category-tag">${escapeHtml(item.category)}</span><button class="add-btn" aria-label="Add ${escapeHtml(item.name)}" onclick="addToCart(${item.id})">+</button></div>
    </article>`).join("") : "<p>No items in this category yet.</p>";
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
document.getElementById("filters").addEventListener("click", e => {
  const btn = e.target.closest("button[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  document.querySelectorAll(".filter").forEach(b => b.classList.toggle("active", b === btn));
  renderMenu();
});
window.addToCart = id => {
  const found = cart.find(x => x.id === id);
  if (found) found.qty++; else cart.push({id,qty:1});
  updateCart();
};
function updateCart() {
  const count = cart.reduce((s,x) => s+x.qty,0);
  const total = cart.reduce((s,x) => s + menu.find(m=>m.id===x.id).price*x.qty,0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = money(total);
  document.getElementById("cartItems").innerHTML = cart.map(x => {
    const item = menu.find(m=>m.id===x.id);
    return `<div class="cart-line"><span>${escapeHtml(item.name)} × ${x.qty}</span><span>${money(item.price*x.qty)} <button onclick="changeQty(${x.id},-1)">−</button> <button onclick="changeQty(${x.id},1)">+</button></span></div>`;
  }).join("") || "<p>Your cart is empty.</p>";
  document.getElementById("modalTotal").textContent = money(total);
}
window.changeQty = (id,delta) => {
  const item=cart.find(x=>x.id===id); if(!item)return;
  item.qty+=delta; if(item.qty<=0)cart=cart.filter(x=>x.id!==id);
  updateCart();
};
const modal=document.getElementById("orderModal");
document.getElementById("cartTab").addEventListener("click",()=>{updateCart();modal.hidden=false;});
document.getElementById("closeModal").addEventListener("click",()=>modal.hidden=true);
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true;});
document.getElementById("orderForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.currentTarget, message=document.getElementById("formMessage");
  if(!cart.length){message.textContent="Please add an item first.";message.className="form-message error";return;}
  const data=Object.fromEntries(new FormData(form).entries());
  data.items=cart.map(x=>({id:x.id,qty:x.qty}));
  const button=form.querySelector("button[type=submit]");button.disabled=true;button.textContent="Sending…";
  try{
    const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not place order");
    message.textContent=`Thank you! Your order #${result.orderId} has been received. Total: ${money(result.total)}. Our team will contact you.`;
    message.className="form-message success";cart=[];updateCart();form.reset();
  }catch(err){message.textContent=err.message;message.className="form-message error";}
  finally{button.disabled=false;button.innerHTML="Place order <span>→</span>";}
});
document.getElementById("mobileMenu").addEventListener("click",()=>document.querySelector(".topbar nav").classList.toggle("open"));
document.querySelectorAll(".topbar nav a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".topbar nav").classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();
loadMenu();
