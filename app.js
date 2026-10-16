const $ = (id) => document.getElementById(id);
const rupiah = (n) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
const starterProducts = [
 {id:1,name:'Air Mineral 600 ml',barcode:'899100000001',price:4000,stock:20},
 {id:2,name:'Mi Instan',barcode:'899100000002',price:3500,stock:30},
 {id:3,name:'Kopi Sachet',barcode:'899100000003',price:2000,stock:25},
 {id:4,name:'Roti Kemasan',barcode:'899100000004',price:6000,stock:8}
];
const load = (key, fallback) => { try { const v=localStorage.getItem('kp_'+key); return v?JSON.parse(v):fallback; } catch { return fallback; } };
let products = load('products',starterProducts);
let sales = load('sales',[]);
let cashEntries = load('cash',[]);
let cart = [];
let deferredInstallPrompt = null;
function save(){localStorage.setItem('kp_products',JSON.stringify(products));localStorage.setItem('kp_sales',JSON.stringify(sales));localStorage.setItem('kp_cash',JSON.stringify(cashEntries));}
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}
function cartTotal(){return cart.reduce((sum,item)=>sum+item.price*item.qty,0);}
function render(){
 const today=new Date().toDateString();
 const todays=sales.filter(s=>new Date(s.date).toDateString()===today);
 $('salesTotal').textContent=rupiah(todays.reduce((s,x)=>s+x.total,0));
 $('salesCount').textContent=`${todays.length} transaksi`;
 $('productCount').textContent=products.length;
 $('lowStock').textContent=products.filter(p=>p.stock<=5).length;
 $('productGrid').innerHTML=products.map(p=>`<button class="product-tile" data-add="${p.id}" ${p.stock<=0?'disabled':''}><strong>${esc(p.name)}</strong><span class="price">${rupiah(p.price)}</span><span>Stok: ${p.stock}</span></button>`).join('')||'<p class="muted">Belum ada produk.</p>';
 $('productRows').innerHTML=products.map(p=>`<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.barcode||'—')}</td><td>${rupiah(p.price)}</td><td class="${p.stock<=5?'stock-low':''}">${p.stock}</td><td><button class="text-button" data-delete="${p.id}">Hapus</button></td></tr>`).join('')||'<tr><td colspan="5">Belum ada produk.</td></tr>';
 $('cartItems').innerHTML=cart.length?cart.map(i=>`<div class="cart-line"><div><strong>${esc(i.name)}</strong><small>${rupiah(i.price)} × ${i.qty}</small></div><div class="qty-controls"><button data-dec="${i.id}" aria-label="Kurangi">−</button><b>${i.qty}</b><button data-inc="${i.id}" aria-label="Tambah">+</button></div></div>`).join(''):'<p class="muted">Belum ada produk.</p>';
 $('cartTotal').textContent=rupiah(cartTotal());
 const cash=Number($('cashReceived').value)||0;
 $('changeTotal').textContent=rupiah($('paymentMethod').value==='Tunai'?Math.max(0,cash-cartTotal()):0);
 $('cashEntries').innerHTML=cashEntries.slice().reverse().map(e=>`<div class="entry"><div><strong>${esc(e.note)}</strong><small>${esc(e.type)} · ${new Date(e.date).toLocaleString('id-ID')}</small></div><strong class="${e.type==='Pemasukan'?'income':'expense'}">${e.type==='Pengeluaran'?'−':'+'}${rupiah(e.amount)}</strong></div>`).join('')||'<p class="muted">Belum ada catatan arus kas.</p>';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id==='panel-'+btn.dataset.tab));}));
$('productGrid').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;const p=products.find(x=>x.id===Number(b.dataset.add));if(!p||p.stock<=0)return;const item=cart.find(x=>x.id===p.id);if(item){if(item.qty>=p.stock)return toast('Jumlah melebihi stok.');item.qty++;}else cart.push({...p,qty:1});render();});
$('cartItems').addEventListener('click',e=>{const inc=e.target.closest('[data-inc]'),dec=e.target.closest('[data-dec]');if(inc){const i=cart.find(x=>x.id===Number(inc.dataset.inc));const p=products.find(x=>x.id===i.id);if(i.qty<p.stock)i.qty++;else toast('Jumlah melebihi stok.');}if(dec){const id=Number(dec.dataset.dec),i=cart.find(x=>x.id===id);if(i.qty<=1)cart=cart.filter(x=>x.id!==id);else i.qty--;}render();});
$('productForm').addEventListener('submit',e=>{e.preventDefault();const name=$('newName').value.trim(),barcode=$('newBarcode').value.trim(),price=Number($('newPrice').value),stock=Number($('newStock').value);if(!name||price<0||stock<0)return;products.push({id:Date.now(),name,barcode,price,stock});save();e.target.reset();render();toast('Produk ditambahkan.');});
$('productRows').addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;const id=Number(b.dataset.delete);products=products.filter(p=>p.id!==id);cart=cart.filter(p=>p.id!==id);save();render();toast('Produk dihapus.');});
$('cashForm').addEventListener('submit',e=>{e.preventDefault();cashEntries.push({id:Date.now(),type:$('cashType').value,amount:Number($('cashAmount').value),note:$('cashNote').value.trim(),date:new Date().toISOString()});save();e.target.reset();render();toast('Catatan arus kas disimpan.');});
$('paymentMethod').addEventListener('change',render);$('cashReceived').addEventListener('input',render);
$('checkoutBtn').addEventListener('click',()=>{if(!cart.length)return toast('Keranjang masih kosong.');const total=cartTotal(),method=$('paymentMethod').value,cash=Number($('cashReceived').value)||0;if(method==='Tunai'&&cash<total)return toast('Uang diterima belum cukup.');for(const i of cart){const p=products.find(p=>p.id===i.id);if(!p||p.stock<i.qty)return toast('Stok berubah. Periksa keranjang.');}for(const i of cart){products.find(p=>p.id===i.id).stock-=i.qty;}sales.push({id:Date.now(),items:cart.map(({id,name,price,qty})=>({id,name,price,qty})),total,method,date:new Date().toISOString()});cart=[];$('cashReceived').value='';save();render();toast('Transaksi demo berhasil dicatat.');});
$('clearCart').addEventListener('click',()=>{cart=[];render();});
$('resetDemo').addEventListener('click',()=>{if(!confirm('Hapus semua data demo di browser ini dan mulai ulang?'))return;products=starterProducts.map(x=>({...x}));sales=[];cashEntries=[];cart=[];save();render();toast('Data demo direset.');});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('installBtn').classList.remove('hidden');});
$('installBtn').addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('installBtn').classList.add('hidden');});
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
render();

/* Koneksi Supabase + login Kasir Pintar */
const sb = window.supabase.createClient(
  'https://rhmjurqpegavkvccdzpf.supabase.co',
  'sb_publishable_RyxIarjLZwYt8_a4-CUceQ_Ha6ZIpRG'
);

const authBox = document.getElementById('authBox');
const authForm = document.getElementById('authForm');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('authMessage');
const shell = document.querySelector('.shell');

const appSections = [...shell.children].filter(
  el => el !== authBox
);

function showApp(session) {
  appSections.forEach(el => el.hidden = !session);
  authForm.hidden = !!session;
  signupBtn.hidden = !!session;
  logoutBtn.hidden = !session;
  authMessage.textContent = session
    ? 'Login sebagai ' + session.user.email
    : 'Silakan login atau daftar akun baru.';
}

authForm.addEventListener('submit', async e => {
  e.preventDefault();
  authMessage.textContent = 'Memproses login...';

  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  const { error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  authMessage.textContent = error
    ? 'Login gagal: ' + error.message
    : 'Login berhasil.';
});

signupBtn.addEventListener('click', async () => {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  if (!email || password.length < 6) {
    authMessage.textContent =
      'Isi email dan password minimal 6 karakter.';
    return;
  }

  authMessage.textContent = 'Membuat akun...';

  const { error } = await sb.auth.signUp({
    email,
    password
  });

  authMessage.textContent = error
    ? 'Pendaftaran gagal: ' + error.message
    : 'Pendaftaran berhasil. Periksa email jika diminta verifikasi.';
});

logoutBtn.addEventListener('click', async () => {
  const { error } = await sb.auth.signOut();
  if (error) authMessage.textContent = error.message;
});

sb.auth.onAuthStateChange((_event, session) => {
  showApp(session);
});

sb.auth.getSession().then(({ data, error }) => {
  if (error) {
    authMessage.textContent = 'Gagal memeriksa login.';
    return;
  }
  showApp(data.session);
});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
