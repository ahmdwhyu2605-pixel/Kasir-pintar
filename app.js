
const $ = id => document.getElementById(id);
const rupiah = n => new Intl.NumberFormat('id-ID',{
  style:'currency',currency:'IDR',maximumFractionDigits:0
}).format(Number(n)||0);

const sb = window.supabase.createClient(
  'https://rhmjurqpegavkvccdzpf.supabase.co',
  'sb_publishable_RyxIarjLZwYt8_a4-CUceQ_Ha6ZIpRG'
);

let user = null, storeId = null;
let products = [], sales = [], cashEntries = [], cart = [];
let loading = false, installPrompt = null;

const starterProducts = [
  {name:'Air Mineral 600 ml',barcode:'899100000001',price:4000,stock:20},
  {name:'Mi Instan',barcode:'899100000002',price:3500,stock:30},
  {name:'Kopi Sachet',barcode:'899100000003',price:2000,stock:25},
  {name:'Roti Kemasan',barcode:'899100000004',price:6000,stock:8}
];

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function toast(msg){
  const t=$('toast');
  if(!t)return alert(msg);
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
function totalCart(){
  return cart.reduce((s,p)=>s+Number(p.price)*p.qty,0);
}

function showApp(session){
  const authBox=$('authBox');
  const shell=document.querySelector('.shell');
  [...shell.children].filter(el=>el!==authBox)
    .forEach(el=>el.hidden=!session);
  $('authForm').hidden=!!session;
  $('signupBtn').hidden=!!session;
  $('logoutBtn').hidden=!session;
  $('authMessage').textContent=session
    ? 'Login sebagai '+(session.user.email||'pengguna')
    : 'Silakan login atau daftar akun baru.';
}

async function loadData(){
  if(!user||loading)return;
  loading=true;
  try{
    const {data:profile,error:pe}=await sb.from('profiles')
      .select('store_id').eq('id',user.id).single();
    if(pe)throw pe;
    if(!profile?.store_id)throw Error('Akun belum memiliki toko.');
    storeId=profile.store_id;

    const [pr,tr,cr]=await Promise.all([
      sb.from('products').select('*').eq('store_id',storeId).order('id'),
      sb.from('transactions').select('*').eq('store_id',storeId)
        .order('created_at',{ascending:false}),
      sb.from('cash_entries').select('*').eq('store_id',storeId)
        .order('created_at')
    ]);
    if(pr.error)throw pr.error;
    if(tr.error)throw tr.error;
    if(cr.error)throw cr.error;

    products=(pr.data||[]).map(p=>({
      ...p,id:Number(p.id),price:Number(p.price),stock:Number(p.stock)
    }));
    sales=(tr.data||[]).map(s=>({
      ...s,total:Number(s.total),date:s.created_at,
      items:Array.isArray(s.items)?s.items:[]
    }));
    cashEntries=(cr.data||[]).map(c=>({
      ...c,amount:Number(c.amount),date:c.created_at
    }));

    if(!products.length){
      const {data,error}=await sb.from('products')
        .insert(starterProducts.map(p=>({...p,store_id:storeId})))
        .select('*');
      if(error)throw error;
      products=(data||[]).map(p=>({
        ...p,id:Number(p.id),price:Number(p.price),stock:Number(p.stock)
      }));
    }
    render();
    $('authMessage').textContent='Login: '+user.email+' · Data online';
  }catch(e){
    console.error(e);
    toast('Gagal memuat data: '+e.message);
  }finally{loading=false;}
}

function render(){
  const today=new Date().toDateString();
  const todaySales=sales.filter(s=>
    new Date(s.date||s.created_at).toDateString()===today);

  if($('salesTotal'))$('salesTotal').textContent=
    rupiah(todaySales.reduce((s,x)=>s+Number(x.total),0));
  if($('salesCount'))$('salesCount').textContent=
    todaySales.length+' transaksi';
  if($('productCount'))$('productCount').textContent=products.length;
  if($('lowStock'))$('lowStock').textContent=
    products.filter(p=>p.stock<=5).length;

  if($('productGrid'))$('productGrid').innerHTML=products.map(p=>
    `<button class="product-tile" data-add="${p.id}" ${p.stock<=0?'disabled':''}>
      <strong>${esc(p.name)}</strong><span class="price">${rupiah(p.price)}</span>
      <span>Stok: ${p.stock}</span></button>`
  ).join('')||'<p class="muted">Belum ada produk.</p>';

  if($('productRows'))$('productRows').innerHTML=products.map(p=>
    `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.barcode||'—')}</td>
    <td>${rupiah(p.price)}</td><td class="${p.stock<=5?'stock-low':''}">${p.stock}</td>
    <td><button class="text-button" data-delete="${p.id}">Hapus</button></td></tr>`
  ).join('')||'<tr><td colspan="5">Belum ada produk.</td></tr>';

  if($('cartItems'))$('cartItems').innerHTML=cart.length?cart.map(p=>
    `<div class="cart-line"><div><strong>${esc(p.name)}</strong>
    <small>${rupiah(p.price)} × ${p.qty}</small></div>
    <div class="qty-controls"><button data-dec="${p.id}">−</button>
    <b>${p.qty}</b><button data-inc="${p.id}">+</button></div></div>`
  ).join(''):'<p class="muted">Belum ada produk.</p>';

  if($('cartTotal'))$('cartTotal').textContent=rupiah(totalCart());
  const received=Number($('cashReceived')?.value)||0;
  if($('changeTotal'))$('changeTotal').textContent=rupiah(
    $('paymentMethod')?.value==='Tunai'?Math.max(0,received-totalCart()):0
  );

  if($('cashEntries'))$('cashEntries').innerHTML=cashEntries.slice().reverse().map(c=>
    `<div class="entry"><div><strong>${esc(c.note)}</strong>
    <small>${esc(c.type)} · ${new Date(c.date||c.created_at).toLocaleString('id-ID')}</small></div>
    <strong class="${c.type==='Pemasukan'?'income':'expense'}">
    ${c.type==='Pengeluaran'?'−':'+'}${rupiah(c.amount)}</strong></div>`
  ).join('')||'<p class="muted">Belum ada catatan arus kas.</p>';
}

document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));
  document.querySelectorAll('.panel').forEach(x=>
    x.classList.toggle('active',x.id==='panel-'+btn.dataset.tab));
}));

$('productGrid').addEventListener('click',e=>{
  const b=e.target.closest('[data-add]');if(!b)return;
  const p=products.find(x=>x.id===Number(b.dataset.add));
  if(!p||p.stock<=0)return;
  const item=cart.find(x=>x.id===p.id);
  if(item){
    if(item.qty>=p.stock)return toast('Jumlah melebihi stok.');
    item.qty++;
  }else cart.push({...p,qty:1});
  render();
});

$('cartItems').addEventListener('click',e=>{
  const inc=e.target.closest('[data-inc]');
  const dec=e.target.closest('[data-dec]');
  if(inc){
    const id=Number(inc.dataset.inc);
    const item=cart.find(x=>x.id===id);
    const p=products.find(x=>x.id===id);
    if(item&&p&&item.qty<p.stock)item.qty++;
    else toast('Jumlah melebihi stok.');
  }
  if(dec){
    const id=Number(dec.dataset.dec);
    const item=cart.find(x=>x.id===id);
    if(item){
      if(item.qty<=1)cart=cart.filter(x=>x.id!==id);
      else item.qty--;
    }
  }
  render();
});

$('productForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!storeId)return toast('Login dahulu.');
  const name=$('newName').value.trim();
  const barcode=$('newBarcode').value.trim();
  const price=Number($('newPrice').value);
  const stock=Number($('newStock').value);
  if(!name||!Number.isFinite(price)||price<0||
    !Number.isInteger(stock)||stock<0)return toast('Periksa data produk.');

  const {data,error}=await sb.from('products').insert({
    store_id:storeId,name,barcode:barcode||null,price,stock
  }).select('*').single();
  if(error)return toast('Gagal menyimpan: '+error.message);
  products.push({...data,id:Number(data.id),price:Number(data.price),stock:Number(data.stock)});
  e.target.reset();render();toast('Produk tersimpan online.');
});

$('productRows').addEventListener('click',async e=>{
  const b=e.target.closest('[data-delete]');if(!b)return;
  const id=Number(b.dataset.delete);
  if(!confirm('Hapus produk ini?'))return;
  const {error}=await sb.from('products').delete()
    .eq('id',id).eq('store_id',storeId);
  if(error)return toast('Gagal menghapus: '+error.message);
  products=products.filter(p=>p.id!==id);
  cart=cart.filter(p=>p.id!==id);
  render();toast('Produk dihapus online.');
});

$('cashForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!storeId)return toast('Login dahulu.');
  const type=$('cashType').value;
  const amount=Number($('cashAmount').value);
  const note=$('cashNote').value.trim();
  if(!note||!Number.isFinite(amount)||amount<=0)
    return toast('Isi keterangan dan nominal yang benar.');

  const {data,error}=await sb.from('cash_entries').insert({
    store_id:storeId,type,amount,note
  }).select('*').single();
  if(error)return toast('Gagal menyimpan: '+error.message);
  cashEntries.push({...data,id:Number(data.id),amount:Number(data.amount),date:data.created_at});
  e.target.reset();render();toast('Arus kas tersimpan online.');
});

$('paymentMethod').addEventListener('change',render);
$('cashReceived').addEventListener('input',render);

$('checkoutBtn').addEventListener('click',async()=>{
  if(!storeId)return toast('Login dahulu.');
  if(!cart.length)return toast('Keranjang masih kosong.');
  const method=$('paymentMethod').value;
  const received=Number($('cashReceived').value)||0;
  if(method==='Tunai'&&received<totalCart())
    return toast('Uang diterima belum cukup.');

  const btn=$('checkoutBtn'),old=btn.textContent;
  btn.disabled=true;btn.textContent='Memproses...';
  try{
    const {error}=await sb.rpc('checkout_sale',{
      p_store_id:storeId,
      p_items:cart.map(({id,qty})=>({id,qty})),
      p_method:method
    });
    if(error)throw error;
    cart=[];
    $('cashReceived').value='';
    await loadData();
    toast('Transaksi tersimpan online.');
  }catch(e){toast('Transaksi gagal: '+e.message);}
  finally{btn.disabled=false;btn.textContent=old;}
});

$('clearCart').addEventListener('click',()=>{cart=[];render();});

$('resetDemo').addEventListener('click',async()=>{
  if(!storeId)return toast('Login dahulu.');
  if(!confirm('Hapus seluruh produk, transaksi, dan arus kas toko ini?'))return;
  try{
    for(const table of ['cash_entries','transactions','products']){
      const {error}=await sb.from(table).delete().eq('store_id',storeId);
      if(error)throw error;
    }
    const {data,error}=await sb.from('products')
      .insert(starterProducts.map(p=>({...p,store_id:storeId}))).select('*');
    if(error)throw error;
    products=(data||[]).map(p=>({...p,id:Number(p.id),price:Number(p.price),stock:Number(p.stock)}));
    sales=[];cashEntries=[];cart=[];render();toast('Data toko direset.');
  }catch(e){toast('Reset gagal: '+e.message);}
});

$('authForm').addEventListener('submit',async e=>{
  e.preventDefault();
  $('authMessage').textContent='Memproses login...';
  const email=$('authEmail').value.trim();
  const password=$('authPassword').value;
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error)$('authMessage').textContent='Login gagal: '+error.message;
});

$('signupBtn').addEventListener('click',async()=>{
  const email=$('authEmail').value.trim();
  const password=$('authPassword').value;
  if(!email||password.length<6){
    $('authMessage').textContent='Isi email dan password minimal 6 karakter.';
    return;
  }
  $('authMessage').textContent='Membuat akun...';
  const {data,error}=await sb.auth.signUp({email,password});
  if(error)$('authMessage').textContent='Pendaftaran gagal: '+error.message;
  else if(!data.session)$('authMessage').textContent='Akun dibuat. Cek email untuk verifikasi, lalu login.';
  else $('authMessage').textContent='Akun berhasil dibuat.';
});

$('logoutBtn').addEventListener('click',async()=>{
  const {error}=await sb.auth.signOut();
  if(error)$('authMessage').textContent='Logout gagal: '+error.message;
});

sb.auth.onAuthStateChange((_event,session)=>{
  showApp(session);
  if(session){
    user=session.user;
    setTimeout(loadData,0);
  }else{
    user=null;storeId=null;products=[];sales=[];cashEntries=[];cart=[];
    render();
  }
});

sb.auth.getSession().then(({data,error})=>{
  if(error){$('authMessage').textContent='Gagal memeriksa login: '+error.message;return;}
  showApp(data.session);
  if(data.session){user=data.session.user;loadData();}
});

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();installPrompt=e;
  $('installBtn').classList.remove('hidden');
});
$('installBtn').addEventListener('click',async()=>{
  if(!installPrompt)return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt=null;
  $('installBtn').classList.add('hidden');
});

if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
   }
     
