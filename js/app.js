// ═══════════════════════════════════════════════════════════════
// app.js — UI & navigasi WarungKu Internal
// ═══════════════════════════════════════════════════════════════

var STATE = {
  page: 'beranda',
  mutasiTab: 'masuk',
  keuanganTab: 'pemasukan',
  labaRange: 'hari',
  session: null
};

// ═══════════════════ AUTH: SPLASH, LOGIN, SIGNUP ═══════════════════
var LS_KEY_USERS   = 'warungku_internal_users_v1';
var LS_KEY_SESSION = 'warungku_internal_session_v1';

function getUsers(){ try{ return JSON.parse(localStorage.getItem(LS_KEY_USERS)||'[]'); }catch(e){ return []; } }
function saveUsers(u){ localStorage.setItem(LS_KEY_USERS, JSON.stringify(u)); }
function getSession(){ try{ return JSON.parse(localStorage.getItem(LS_KEY_SESSION)||'null'); }catch(e){ return null; } }
function saveSession(s){ localStorage.setItem(LS_KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(LS_KEY_SESSION); }
function isLoggedIn(){ return !!getSession(); }

function showAuthView(name){
  ['splash','login','signup','success','app'].forEach(function(v){
    var el = document.getElementById('view-'+v);
    if(el) el.style.display = (v === name) ? 'flex' : 'none';
  });
  // Re-trigger animasi logo tiap kali splash/login/signup ditampilkan
  if(name === 'splash' || name === 'login' || name === 'signup'){
    var logo = document.querySelector('#view-'+name+' .auth-logo, #view-'+name+' .splash-logo');
    if(logo){ logo.style.animation = 'none'; void logo.offsetWidth; logo.style.animation = ''; }
  }
}

function doLogin(){
  var username = (document.getElementById('login-username').value||'').trim();
  var password = document.getElementById('login-password').value||'';
  var errEl = document.getElementById('login-err');
  errEl.style.display = 'none';

  if(!username || !password){
    errEl.textContent = '⚠️ Username dan password wajib diisi!';
    errEl.style.display = 'block'; return;
  }
  var found = getUsers().find(function(u){ return u.username === username && u.password === password; });
  if(!found){
    errEl.textContent = '❌ Username atau password salah, atau akun belum terdaftar.';
    errEl.style.display = 'block'; return;
  }
  saveSession({username: found.username, nama: found.nama, warung: found.warung});
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  showSuccessThenEnter('Login Berhasil!', 'Selamat bekerja, ' + (found.nama || found.username) + '!');
}

function doSignup(){
  var nama     = (document.getElementById('signup-nama').value||'').trim();
  var warung   = (document.getElementById('signup-warung').value||'').trim();
  var username = (document.getElementById('signup-username').value||'').trim();
  var password = document.getElementById('signup-password').value||'';
  var konfirm  = document.getElementById('signup-konfirmasi').value||'';
  var errEl    = document.getElementById('signup-err');
  errEl.style.display = 'none';

  if(!nama || !warung || !username || !password || !konfirm){
    errEl.textContent = '⚠️ Semua kolom wajib diisi!';
    errEl.style.display = 'block'; return;
  }
  if(/\s/.test(username)){
    errEl.textContent = '⚠️ Username tidak boleh mengandung spasi.';
    errEl.style.display = 'block'; return;
  }
  if(password.length < 6){
    errEl.textContent = '⚠️ Password minimal 6 karakter.';
    errEl.style.display = 'block'; return;
  }
  if(password !== konfirm){
    errEl.textContent = '❌ Konfirmasi password tidak cocok!';
    errEl.style.display = 'block'; return;
  }
  var users = getUsers();
  if(users.find(function(u){ return u.username === username; })){
    errEl.textContent = '❌ Username sudah dipakai, pilih username lain.';
    errEl.style.display = 'block'; return;
  }
  var newUser = {username: username, password: password, nama: nama, warung: warung};
  users.push(newUser);
  saveUsers(users);
  saveSession({username: newUser.username, nama: newUser.nama, warung: newUser.warung});
  showSuccessThenEnter('Pendaftaran Sukses!', 'Warung "' + warung + '" siap dikelola.');
}

function showSuccessThenEnter(title, sub){
  document.getElementById('success-title').textContent = title;
  document.getElementById('success-sub').textContent = sub;
  showAuthView('success');
  setTimeout(enterApp, 1300);
}

function doLogout(){
  if(!confirm('Keluar dari akun ini?')) return;
  clearSession();
  STATE.session = null;
  closeSheet();
  showAuthView('login');
}

function enterApp(){
  STATE.session = getSession();
  showAuthView('app');
  goPage('beranda');
}

function getGreeting(){
  var jam = new Date().getHours();
  if(jam < 11) return 'Selamat Pagi';
  if(jam < 15) return 'Selamat Siang';
  if(jam < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

var ICONS = {
  beranda: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  bahan:   '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.72V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.72c.57-.38 1-.99 1-1.72V4c0-1.1-.9-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/></svg>',
  mutasi:  '<svg viewBox="0 0 24 24"><path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"/></svg>',
  keuangan:'<svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>'
};

function appInit(){
  bindNav();
  showAuthView('splash');
  setTimeout(function(){
    if(isLoggedIn()){
      enterApp();
    } else {
      showAuthView('login');
    }
  }, 1900);
}

function bindNav(){
  document.querySelectorAll('.ni').forEach(function(el){
    el.addEventListener('click', function(){ goPage(el.dataset.page); });
  });
}

function goPage(page){
  STATE.page = page;
  document.querySelectorAll('.ni').forEach(function(el){
    el.classList.toggle('on', el.dataset.page === page);
  });
  render();
}

function render(){
  var el = document.getElementById('content');
  var title = document.getElementById('topbar-title');
  var sub = document.getElementById('topbar-sub');
  closeSheet();
  var statsEl = document.getElementById('topbar-stats');
  if(STATE.page === 'beranda'){
    var s = STATE.session || getSession();
    title.textContent = getGreeting() + (s && s.nama ? ', ' + s.nama : '') + '!';
    sub.textContent = DB.fmtTgl(DB.todayISO()) + (s && s.warung ? ' \u00b7 ' + s.warung : '');
    statsEl.innerHTML = renderTopbarStats();
    el.innerHTML = renderBeranda();
  } else if(STATE.page === 'bahan'){
    title.textContent = 'Bahan Baku';
    sub.textContent = 'Master data & indikator stok';
    statsEl.innerHTML = '';
    el.innerHTML = renderBahan();
  } else if(STATE.page === 'mutasi'){
    title.textContent = 'Mutasi Stok';
    sub.textContent = 'Barang masuk & keluar';
    statsEl.innerHTML = '';
    el.innerHTML = renderMutasi();
  } else if(STATE.page === 'keuangan'){
    title.textContent = 'Manajemen Keuangan';
    sub.textContent = 'Pemasukan, pengeluaran & laba rugi';
    statsEl.innerHTML = '';
    el.innerHTML = renderKeuangan();
  }
}

// Statistik pemasukan/pengeluaran/laba-rugi digabung ke dalam satu shape biru (topbar)
function renderTopbarStats(){
  var today = DB.todayISO();
  var lr = DB.hitungLabaRugi(today, today);
  var html = '<div class="tb-stat-grid">';
  html += '<div class="tb-stat-card"><div class="tb-stat-label">Pemasukan Hari Ini</div><div class="tb-stat-val">'+DB.rp(lr.totalPemasukan)+'</div></div>';
  html += '<div class="tb-stat-card"><div class="tb-stat-label">Pengeluaran Hari Ini</div><div class="tb-stat-val neg">'+DB.rp(lr.totalPengeluaran)+'</div></div>';
  html += '</div>';
  html += '<div class="tb-lr-row"><span class="tb-lr-label">LABA / RUGI HARI INI</span>';
  html += '<span class="tb-lr-val'+(lr.labaRugi<0?' neg':'')+'">'+DB.rp(lr.labaRugi)+'</span></div>';
  return html;
}

function toast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}

// ═══════════════════ BERANDA ═══════════════════
function renderBeranda(){
  var kritis = DB.bahan.filter(function(b){ return DB.statusStok(b) === 'kritis'; });
  var habis = DB.bahan.filter(function(b){ return DB.statusStok(b) === 'habis'; });

  var html = '';
  if(habis.length || kritis.length){
    html += '<div class="sec-title">Peringatan Stok</div>';
    habis.forEach(function(b){
      html += '<div class="alert-card danger"><div class="alert-emoji">⛔</div><div class="alert-text"><b>'+esc(b.nama)+'</b> stok habis (0 '+esc(b.satuan)+'). Segera lakukan restock.</div></div>';
    });
    kritis.forEach(function(b){
      html += '<div class="alert-card"><div class="alert-emoji">⚠️</div><div class="alert-text"><b>'+esc(b.nama)+'</b> tersisa '+fmtNum(b.stok)+' '+esc(b.satuan)+' (batas minimum '+fmtNum(b.stokMin)+' '+esc(b.satuan)+').</div></div>';
    });
  } else {
    html += '<div class="sec-title">Peringatan Stok</div>';
    html += '<div class="empty-state" style="padding:20px;"><div class="em">✅</div>Semua stok bahan baku aman.</div>';
  }

  html += '<div class="sec-title">Ringkasan Cepat</div>';
  html += '<div class="card"><div class="lr-row"><span>Jumlah jenis bahan baku</span><b>'+DB.bahan.length+'</b></div>';
  html += '<div class="lr-row"><span>Total mutasi tercatat</span><b>'+DB.mutasi.length+'</b></div>';
  html += '<div class="lr-row"><span>Bahan stok kritis / habis</span><b style="color:var(--red);">'+(kritis.length+habis.length)+'</b></div></div>';

  return html;
}

// ═══════════════════ MODUL 1: BAHAN BAKU ═══════════════════
function renderBahan(){
  var html = '<div class="card-row" style="margin-bottom:14px;">';
  html += '<span style="font-size:12.5px;color:var(--text-mid);">'+DB.bahan.length+' jenis bahan baku</span>';
  html += '<button class="btn btn-primary btn-sm" onclick="openBahanForm()">+ Tambah Bahan</button></div>';

  if(!DB.bahan.length){
    html += '<div class="empty-state"><div class="em">📦</div>Belum ada data bahan baku.</div>';
  } else {
    var sorted = DB.bahan.slice().sort(function(a,b){
      var order = {habis:0, kritis:1, aman:2};
      return order[DB.statusStok(a)] - order[DB.statusStok(b)] || a.nama.localeCompare(b.nama);
    });
    sorted.forEach(function(b){
      var st = DB.statusStok(b);
      var label = st==='habis' ? 'Habis' : st==='kritis' ? 'Kritis' : 'Aman';
      html += '<div class="bahan-item">';
      html += '<div class="bahan-info"><div class="bahan-nama">'+esc(b.nama)+'</div>';
      html += '<div class="bahan-sub">Stok: '+fmtNum(b.stok)+' '+esc(b.satuan)+' &middot; Min: '+fmtNum(b.stokMin)+' '+esc(b.satuan)+'</div></div>';
      html += '<span class="badge '+st+'">'+label+'</span>';
      html += '<div class="bahan-actions">';
      html += '<button class="icon-btn" onclick="openBahanForm('+b.id+')" title="Edit">✎</button>';
      html += '<button class="icon-btn danger" onclick="konfirmasiHapusBahan('+b.id+')" title="Hapus">🗑</button>';
      html += '</div></div>';
    });
  }
  return html;
}

function openBahanForm(id){
  var b = id ? DB.getBahan(id) : null;
  var html = '<div class="sheet-title"><span>'+(b?'Edit Bahan Baku':'Tambah Bahan Baku')+'</span><span class="sheet-close" onclick="closeSheet()">&times;</span></div>';
  html += '<div class="field"><label>Nama Bahan</label><input id="f-nama" type="text" value="'+(b?esc(b.nama):'')+'" placeholder="Contoh: Beras Premium"></div>';
  html += '<div class="field-row">';
  html += '<div class="field"><label>Satuan</label><select id="f-satuan">'+satuanOptions(b?b.satuan:'kg')+'</select></div>';
  html += '<div class="field"><label>Stok Minimum</label><input id="f-stokmin" type="number" step="any" value="'+(b?b.stokMin:'')+'" placeholder="0"></div>';
  html += '</div>';
  if(!b){
    html += '<div class="field"><label>Stok Awal</label><input id="f-stok" type="number" step="any" value="0"><div class="field-hint">Jumlah stok saat ini saat pertama kali dicatat.</div></div>';
  }
  html += '<button class="btn btn-primary" onclick="simpanBahan('+(b?b.id:'null')+')">Simpan</button>';
  openSheet(html);
}

function simpanBahan(id){
  try{
    var obj = {
      nama: document.getElementById('f-nama').value,
      satuan: document.getElementById('f-satuan').value,
      stokMin: document.getElementById('f-stokmin').value
    };
    if(id){
      DB.updateBahan(id, obj);
      toast('Bahan baku diperbarui');
    } else {
      obj.stok = document.getElementById('f-stok').value;
      DB.tambahBahan(obj);
      toast('Bahan baku ditambahkan');
    }
    closeSheet();
    render();
  }catch(e){ toast(e.message); }
}

function konfirmasiHapusBahan(id){
  var b = DB.getBahan(id);
  if(!b) return;
  if(confirm('Hapus "'+b.nama+'" dari master data? Riwayat mutasi terkait tidak akan terhapus.')){
    DB.hapusBahan(id);
    toast('Bahan baku dihapus');
    render();
  }
}

function satuanOptions(selected){
  var list = ['kg','gram','liter','ml','pcs','pack','dus','karung','tabung','ikat','lainnya'];
  return list.map(function(u){
    return '<option value="'+u+'"'+(u===selected?' selected':'')+'>'+u+'</option>';
  }).join('');
}

// ═══════════════════ MODUL 2: MUTASI STOK ═══════════════════
function renderMutasi(){
  var html = '<div class="tabs">';
  ['masuk','keluar','riwayat'].forEach(function(t){
    var lbl = t==='masuk'?'Barang Masuk':t==='keluar'?'Barang Keluar':'Riwayat';
    html += '<div class="tab '+(STATE.mutasiTab===t?'active':'')+'" onclick="setMutasiTab(\''+t+'\')">'+lbl+'</div>';
  });
  html += '</div>';

  if(!DB.bahan.length){
    return html + '<div class="empty-state"><div class="em">📦</div>Tambahkan bahan baku terlebih dahulu di menu Bahan Baku.</div>';
  }

  if(STATE.mutasiTab === 'masuk') html += formMasuk();
  else if(STATE.mutasiTab === 'keluar') html += formKeluar();
  else html += renderRiwayatMutasi();

  return html;
}

function setMutasiTab(t){ STATE.mutasiTab = t; render(); }

function bahanOptions(){
  return DB.bahan.slice().sort(function(a,b){return a.nama.localeCompare(b.nama);}).map(function(b){
    return '<option value="'+b.id+'">'+esc(b.nama)+' (stok: '+fmtNum(b.stok)+' '+esc(b.satuan)+')</option>';
  }).join('');
}

function formMasuk(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="m-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Nama Bahan</label><select id="m-bahan">'+bahanOptions()+'</select></div>';
  html += '<div class="field-row">';
  html += '<div class="field"><label>Jumlah</label><input id="m-jumlah" type="number" step="any" placeholder="0" oninput="updateHargaSatuanPreview()"></div>';
  html += '<div class="field"><label>Total Harga Beli</label><input id="m-total" type="number" step="any" placeholder="0" oninput="updateHargaSatuanPreview()"></div>';
  html += '</div>';
  html += '<div class="field-hint" id="m-harga-satuan-hint" style="margin-bottom:10px;">Harga satuan akan dihitung otomatis.</div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="m-catatan" type="text" placeholder="Contoh: Supplier / no. nota"></div>';
  html += '<button class="btn btn-primary" onclick="simpanMasuk()">Simpan Barang Masuk</button>';
  html += '</div>';
  return html;
}

function updateHargaSatuanPreview(){
  var j = parseFloat(document.getElementById('m-jumlah').value) || 0;
  var t = parseFloat(document.getElementById('m-total').value) || 0;
  var hint = document.getElementById('m-harga-satuan-hint');
  if(j > 0 && t > 0) hint.textContent = 'Harga satuan: ' + DB.rp(t/j) + ' per unit';
  else hint.textContent = 'Harga satuan akan dihitung otomatis.';
}

function simpanMasuk(){
  try{
    DB.tambahMutasiMasuk({
      tgl: document.getElementById('m-tgl').value,
      bahanId: document.getElementById('m-bahan').value,
      jumlah: document.getElementById('m-jumlah').value,
      totalHarga: document.getElementById('m-total').value,
      catatan: document.getElementById('m-catatan').value
    });
    toast('Barang masuk dicatat & stok diperbarui');
    render();
  }catch(e){ toast(e.message); }
}

function formKeluar(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="k-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Nama Bahan</label><select id="k-bahan">'+bahanOptions()+'</select></div>';
  html += '<div class="field"><label>Jumlah</label><input id="k-jumlah" type="number" step="any" placeholder="0"></div>';
  html += '<div class="field"><label>Alasan</label><select id="k-keterangan">';
  ['Operasional','Rusak','Basi','Lainnya'].forEach(function(k){ html += '<option value="'+k+'">'+k+'</option>'; });
  html += '</select></div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="k-catatan" type="text" placeholder="Keterangan tambahan"></div>';
  html += '<button class="btn btn-danger" onclick="simpanKeluar()">Simpan Barang Keluar</button>';
  html += '</div>';
  return html;
}

function simpanKeluar(){
  try{
    DB.tambahMutasiKeluar({
      tgl: document.getElementById('k-tgl').value,
      bahanId: document.getElementById('k-bahan').value,
      jumlah: document.getElementById('k-jumlah').value,
      keterangan: document.getElementById('k-keterangan').value,
      catatan: document.getElementById('k-catatan').value
    });
    toast('Barang keluar dicatat & stok diperbarui');
    render();
  }catch(e){ toast(e.message); }
}

function renderRiwayatMutasi(){
  if(!DB.mutasi.length) return '<div class="empty-state"><div class="em">🗒️</div>Belum ada riwayat mutasi.</div>';
  var html = '';
  DB.mutasi.forEach(function(m){
    html += '<div class="mutasi-item">';
    html += '<div class="mutasi-dot '+m.tipe+'">'+(m.tipe==='masuk'?'⬇️':'⬆️')+'</div>';
    html += '<div class="mutasi-mid"><div class="mutasi-nama">'+esc(m.bahanNama)+'</div>';
    if(m.tipe==='masuk'){
      html += '<div class="mutasi-sub">'+DB.fmtTgl(m.tgl)+' &middot; Barang Masuk'+(m.catatan?' &middot; '+esc(m.catatan):'')+'</div>';
    } else {
      html += '<div class="mutasi-sub">'+DB.fmtTgl(m.tgl)+' &middot; '+esc(m.keterangan)+(m.catatan?' &middot; '+esc(m.catatan):'')+'</div>';
    }
    html += '</div>';
    html += '<div>';
    html += '<div class="mutasi-val '+m.tipe+'">'+(m.tipe==='masuk'?'+':'-')+fmtNum(m.jumlah)+' '+esc(m.satuan)+'</div>';
    if(m.tipe==='masuk') html += '<div class="lr-sub" style="text-align:right;">'+DB.rp(m.totalHarga)+'</div>';
    html += '</div>';
    html += '<button class="icon-btn danger" style="margin-left:4px;" onclick="konfirmasiHapusMutasi('+m.id+')" title="Hapus">🗑</button>';
    html += '</div>';
  });
  return html;
}

function konfirmasiHapusMutasi(id){
  if(confirm('Hapus catatan mutasi ini? Stok akan disesuaikan kembali.')){
    DB.hapusMutasi(id);
    toast('Mutasi dihapus, stok disesuaikan');
    render();
  }
}

// ═══════════════════ MODUL 3: KEUANGAN ═══════════════════
function renderKeuangan(){
  var html = '<div class="tabs">';
  ['pemasukan','pengeluaran','labarugi'].forEach(function(t){
    var lbl = t==='pemasukan'?'Pemasukan':t==='pengeluaran'?'Pengeluaran':'Laba / Rugi';
    html += '<div class="tab '+(STATE.keuanganTab===t?'active':'')+'" onclick="setKeuanganTab(\''+t+'\')">'+lbl+'</div>';
  });
  html += '</div>';

  if(STATE.keuanganTab === 'pemasukan') html += renderPemasukan();
  else if(STATE.keuanganTab === 'pengeluaran') html += renderPengeluaran();
  else html += renderLabaRugi();

  return html;
}

function setKeuanganTab(t){ STATE.keuanganTab = t; render(); }

function renderPemasukan(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="p-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Shift / Periode</label><select id="p-shift">';
  ['Harian','Pagi','Siang','Malam'].forEach(function(s){ html += '<option value="'+s+'">'+s+'</option>'; });
  html += '</select></div>';
  html += '<div class="field"><label>Total Penjualan Kotor</label><input id="p-jumlah" type="number" step="any" placeholder="0"></div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="p-catatan" type="text" placeholder="Contoh: termasuk pesanan online"></div>';
  html += '<button class="btn btn-primary" onclick="simpanPemasukan()">Simpan Pemasukan</button>';
  html += '</div>';

  html += '<div class="sec-title">Riwayat Pemasukan</div>';
  if(!DB.pemasukan.length){
    html += '<div class="empty-state"><div class="em">💰</div>Belum ada data pemasukan.</div>';
  } else {
    DB.pemasukan.forEach(function(p){
      html += '<div class="mutasi-item">';
      html += '<div class="mutasi-dot masuk">💵</div>';
      html += '<div class="mutasi-mid"><div class="mutasi-nama">'+esc(p.shift)+'</div>';
      html += '<div class="mutasi-sub">'+DB.fmtTgl(p.tgl)+(p.catatan?' &middot; '+esc(p.catatan):'')+'</div></div>';
      html += '<div class="mutasi-val masuk">'+DB.rp(p.jumlah)+'</div>';
      html += '<button class="icon-btn danger" style="margin-left:4px;" onclick="konfirmasiHapusPemasukan('+p.id+')">🗑</button>';
      html += '</div>';
    });
  }
  return html;
}

function simpanPemasukan(){
  try{
    DB.tambahPemasukan({
      tgl: document.getElementById('p-tgl').value,
      shift: document.getElementById('p-shift').value,
      jumlah: document.getElementById('p-jumlah').value,
      catatan: document.getElementById('p-catatan').value
    });
    toast('Pemasukan dicatat');
    render();
  }catch(e){ toast(e.message); }
}

function konfirmasiHapusPemasukan(id){
  if(confirm('Hapus catatan pemasukan ini?')){ DB.hapusPemasukan(id); toast('Pemasukan dihapus'); render(); }
}

function renderPengeluaran(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="e-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Kategori</label><select id="e-kategori">';
  ['Listrik','Air','Gaji Karyawan','Sewa Tempat','Transportasi','Lainnya'].forEach(function(k){ html += '<option value="'+k+'">'+k+'</option>'; });
  html += '</select></div>';
  html += '<div class="field"><label>Jumlah</label><input id="e-jumlah" type="number" step="any" placeholder="0"></div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="e-catatan" type="text" placeholder="Keterangan tambahan"></div>';
  html += '<button class="btn btn-primary" onclick="simpanPengeluaran()">Simpan Pengeluaran</button>';
  html += '</div>';

  html += '<div class="sec-title">Belanja Bahan (Otomatis dari Barang Masuk)</div>';
  var belanja = DB.mutasi.filter(function(m){ return m.tipe==='masuk'; });
  if(!belanja.length){
    html += '<div class="empty-state"><div class="em">🧾</div>Belum ada belanja bahan tercatat.</div>';
  } else {
    belanja.slice(0,10).forEach(function(m){
      html += '<div class="mutasi-item">';
      html += '<div class="mutasi-dot keluar">🧾</div>';
      html += '<div class="mutasi-mid"><div class="mutasi-nama">'+esc(m.bahanNama)+'</div>';
      html += '<div class="mutasi-sub">'+DB.fmtTgl(m.tgl)+' &middot; Otomatis dari Barang Masuk</div></div>';
      html += '<div class="mutasi-val keluar">'+DB.rp(m.totalHarga)+'</div>';
      html += '</div>';
    });
    if(belanja.length>10) html += '<div class="field-hint" style="text-align:center;margin:6px 0 14px;">+'+(belanja.length-10)+' transaksi belanja bahan lainnya (lihat Mutasi Stok &rarr; Riwayat)</div>';
  }

  html += '<div class="sec-title">Pengeluaran Operasional Lain</div>';
  if(!DB.pengeluaranManual.length){
    html += '<div class="empty-state"><div class="em">📋</div>Belum ada pengeluaran operasional lain.</div>';
  } else {
    DB.pengeluaranManual.forEach(function(p){
      html += '<div class="mutasi-item">';
      html += '<div class="mutasi-dot keluar">💸</div>';
      html += '<div class="mutasi-mid"><div class="mutasi-nama">'+esc(p.kategori)+'</div>';
      html += '<div class="mutasi-sub">'+DB.fmtTgl(p.tgl)+(p.catatan?' &middot; '+esc(p.catatan):'')+'</div></div>';
      html += '<div class="mutasi-val keluar">'+DB.rp(p.jumlah)+'</div>';
      html += '<button class="icon-btn danger" style="margin-left:4px;" onclick="konfirmasiHapusPengeluaran('+p.id+')">🗑</button>';
      html += '</div>';
    });
  }
  return html;
}

function simpanPengeluaran(){
  try{
    DB.tambahPengeluaranManual({
      tgl: document.getElementById('e-tgl').value,
      kategori: document.getElementById('e-kategori').value,
      jumlah: document.getElementById('e-jumlah').value,
      catatan: document.getElementById('e-catatan').value
    });
    toast('Pengeluaran dicatat');
    render();
  }catch(e){ toast(e.message); }
}

function konfirmasiHapusPengeluaran(id){
  if(confirm('Hapus catatan pengeluaran ini?')){ DB.hapusPengeluaranManual(id); toast('Pengeluaran dihapus'); render(); }
}

function renderLabaRugi(){
  var range = getRange(STATE.labaRange);
  var lr = DB.hitungLabaRugi(range.start, range.end);

  var html = '<div class="chip-row">';
  [['hari','Hari Ini'],['minggu','Minggu Ini'],['bulan','Bulan Ini']].forEach(function(r){
    html += '<div class="chip '+(STATE.labaRange===r[0]?'active':'')+'" onclick="setLabaRange(\''+r[0]+'\')">'+r[1]+'</div>';
  });
  html += '</div>';

  html += '<div class="card">';
  html += '<div class="lr-row"><span>Total Pemasukan</span><b style="color:var(--green-dark);">'+DB.rp(lr.totalPemasukan)+'</b></div>';
  html += '<div class="lr-row"><span>Belanja Bahan Baku</span><b style="color:var(--red);">- '+DB.rp(lr.totalBelanjaBahan)+'</b></div>';
  html += '<div class="lr-row"><span>Pengeluaran Operasional Lain</span><b style="color:var(--red);">- '+DB.rp(lr.totalPengeluaranManual)+'</b></div>';
  html += '<div class="lr-row total"><span>Laba / Rugi Bersih</span><b class="'+(lr.labaRugi>=0?'stat-val pos':'stat-val neg')+'" style="font-size:16px;">'+DB.rp(lr.labaRugi)+'</b></div>';
  html += '</div>';

  html += '<div class="field-hint" style="margin:4px 2px 0;">Periode: '+DB.fmtTgl(range.start)+' &ndash; '+DB.fmtTgl(range.end)+'</div>';
  return html;
}

function setLabaRange(r){ STATE.labaRange = r; render(); }

function getRange(mode){
  var now = new Date();
  var end = DB.todayISO();
  var start = end;
  if(mode === 'minggu'){
    var d = new Date(now); d.setDate(now.getDate() - 6);
    start = toISO(d);
  } else if(mode === 'bulan'){
    var d2 = new Date(now.getFullYear(), now.getMonth(), 1);
    start = toISO(d2);
  }
  return {start: start, end: end};
}

function toISO(d){
  var m=('0'+(d.getMonth()+1)).slice(-2), day=('0'+d.getDate()).slice(-2);
  return d.getFullYear()+'-'+m+'-'+day;
}

// ═══════════════════ SHEET / UTIL ═══════════════════
function openSheet(html){
  document.getElementById('sheet-body').innerHTML = html;
  document.getElementById('sheet-overlay').classList.add('show');
}
function closeSheet(){
  document.getElementById('sheet-overlay').classList.remove('show');
}
function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function fmtNum(n){
  n = Number(n)||0;
  return (n % 1 === 0) ? n.toLocaleString('id-ID') : n.toLocaleString('id-ID', {maximumFractionDigits:2});
}
