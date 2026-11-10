"use strict";
// ---- CONFIG: edit these ----
const CONFIG={
  bookingUrl:"https://squareup.com/appointments/book/YOUR-LINK", // Square Appointments link
  checkoutEndpoint:"" // your server route that creates a hosted checkout session, e.g. "/api/create-checkout-session"
};
// Prices here are for DISPLAY only. Your server must re-price items from its own catalog.
const CATALOG={
  "fit-for-a-king":{name:"Fit for a King (per hour)",price:70},
  "wardrobe-edit":{name:"Wardrobe Edit (per hour)",price:40},
  "suit-planning":{name:"The Suitor (per hour, up to 3 people)",price:150},
  "suit-extra":{name:"The Suitor: additional person (per hour)",price:35}
};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>"$"+n.toFixed(2);
function el(tag,text,cls){const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e}
// ---- Cart (stores only id + qty; invalid ids/quantities are discarded) ----
function getCart(){try{const c=JSON.parse(localStorage.getItem("regal_cart")||"[]");
  return c.filter(i=>CATALOG[i.id]&&Number.isInteger(i.qty)&&i.qty>0&&i.qty<=20)}catch{return[]}}
function saveCart(c){try{localStorage.setItem("regal_cart",JSON.stringify(c))}catch{}updateCount()}
function updateCount(){const n=$("#cart-count");if(n)n.textContent=getCart().reduce((s,i)=>s+i.qty,0)}
function total(c){return c.reduce((s,i)=>s+CATALOG[i.id].price*i.qty,0)}
updateCount();
// ---- Nav + booking links ----
const tg=$(".nav-toggle");if(tg)tg.addEventListener("click",()=>{const o=$("#links").classList.toggle("open");tg.setAttribute("aria-expanded",o)});
$$("[data-book]").forEach(a=>a.href=CONFIG.bookingUrl);
$$("[data-add]").forEach(b=>b.addEventListener("click",()=>{
  const c=getCart(),id=b.dataset.add,it=c.find(i=>i.id===id);
  if(it)it.qty=Math.min(20,it.qty+1);else c.push({id,qty:1});
  saveCart(c);const t=b.textContent;b.textContent="Added ✓";setTimeout(()=>b.textContent=t,1500)}));
// ---- Hero slideshow ----
const hs=$("[data-slides]");if(hs){const imgs=hs.dataset.slides.split(","),d=$(".dots",hs);let i=0;
  const dots=imgs.map(()=>{const s=document.createElement("span");d.appendChild(s);return s});
  const show=n=>{i=n;hs.style.setProperty("--img",`url(${imgs[n]})`);dots.forEach((s,k)=>s.classList.toggle("on",k===n))};
  show(0);if(!matchMedia("(prefers-reduced-motion: reduce)").matches)setInterval(()=>show((i+1)%imgs.length),5000)}
// ---- Blog read more / read less ----
$$("[data-toggle]").forEach(b=>b.addEventListener("click",()=>{const t=document.getElementById(b.dataset.toggle),open=t.hidden;
  t.hidden=!open;b.setAttribute("aria-expanded",open);b.textContent=open?"Read less":"Read more"}));
// ---- Cart page ----
const root=$("#cart-root");
function renderCart(){root.replaceChildren();const c=getCart();
  if(!c.length){root.append(el("p","Your cart is empty."),Object.assign(el("a","Browse services","btn"),{href:"../services/services.html"}));return}
  const t=el("table"),h=t.createTHead().insertRow();["Service","Rate","Hours","",""].forEach(x=>h.append(el("th",x)));
  const b=t.createTBody();
  c.forEach(i=>{const r=b.insertRow();r.insertCell().textContent=CATALOG[i.id].name;r.insertCell().textContent=money(CATALOG[i.id].price);
    const q=el("input");q.type="number";q.min=1;q.max=20;q.value=i.qty;q.setAttribute("aria-label","Hours");
    q.addEventListener("change",()=>{const v=parseInt(q.value,10);i.qty=v>0&&v<=20?v:1;saveCart(c);renderCart()});
    r.insertCell().append(q);r.insertCell().textContent=money(CATALOG[i.id].price*i.qty);
    const x=el("button","Remove","rm");x.addEventListener("click",()=>{saveCart(c.filter(k=>k!==i));renderCart()});r.insertCell().append(x)});
  root.append(t,el("p","Total: "+money(total(c)),"tot"),Object.assign(el("a","Checkout","btn"),{href:"../Checkout/checkout.html"}))}
if(root)renderCart();
// ---- Checkout ----
const cf=$("#checkout-form");
function status(f,msg,err){const s=$(".status",f);s.textContent=msg;s.className="status"+(err?" err":"")}
if(cf){const c=getCart(),s=$("#summary");
  if(!c.length){s.append(el("p","Your cart is empty."),Object.assign(el("a","Browse services","btn"),{href:"../services/services.html"}));cf.hidden=true}
  else{c.forEach(i=>s.append(el("p",`${CATALOG[i.id].name} × ${i.qty}: ${money(CATALOG[i.id].price*i.qty)}`)));s.append(el("p","Total: "+money(total(c)),"tot"))}
  cf.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(cf);
    if(f.get("website"))return; // honeypot: bots only
    const name=(f.get("name")||"").trim(),email=(f.get("email")||"").trim();
    if(!name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return status(cf,"Enter your name and a valid email.",true);
    if(!CONFIG.checkoutEndpoint)return status(cf,"Online payment isn't connected yet. Please call 719-419-2595 or book through Square.",true);
    const btn=$("button",cf);btn.disabled=true;status(cf,"Redirecting to secure payment…");
    try{const r=await fetch(CONFIG.checkoutEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",
      body:JSON.stringify({items:getCart(),customer:{name,email,phone:f.get("phone"),city:f.get("city"),notes:f.get("notes")}})});
      const d=await r.json();if(!r.ok||typeof d.url!=="string"||!d.url.startsWith("https://"))throw 0;location.assign(d.url)}
    catch{btn.disabled=false;status(cf,"We couldn't start checkout. Please try again or call us.",true)}})}
// ---- Contact form (opens the visitor's email app; swap for a backend later) ----
const ct=$("#contact-form");if(ct)ct.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(ct);
  if(!f.get("name").trim()||!f.get("message").trim()||!ct.email.checkValidity()||!ct.email.value)return status(ct,"Fill in every field with a valid email.",true);
  location.href="mailto:consult@regalwardrobe.com?subject="+encodeURIComponent("Website inquiry from "+f.get("name"))+"&body="+encodeURIComponent(f.get("message")+"\n\n"+f.get("email"));
  status(ct,"Opening your email app…")});
