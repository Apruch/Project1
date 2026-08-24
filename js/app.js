// ═══════════════════════════════════════════════════════════════
// app.js — UI & navigasi WarungKu Internal (tersimpan di perangkat / localStorage)
// ═══════════════════════════════════════════════════════════════

var STATE = {
  page: 'beranda',
  mutasiTab: 'masuk',
  keuanganTab: 'pemasukan',
  labaRange: 'hari',
  session: null
};

// ═══════════════════ AUTH: SPLASH, LOGIN, SIGNUP ═══════════════════
var LS_KEY_SESSION = 'warungku_internal_session_v1';
var LS_KEY_USERS = 'warungku_internal_users_v1';

function getSession(){ try{ return JSON.parse(localStorage.getItem(LS_KEY_SESSION)||'null'); }catch(e){ return null; } }
function saveSession(s){ localStorage.setItem(LS_KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(LS_KEY_SESSION); }
function isLoggedIn(){ return !!getSession(); }

function getUsers(){ try{ return JSON.parse(localStorage.getItem(LS_KEY_USERS)||'[]'); }catch(e){ return []; } }
function saveUsers(u){ localStorage.setItem(LS_KEY_USERS, JSON.stringify(u)); }

// Hash password dengan Web Crypto (SHA-256) — supaya tidak tersimpan polos
// di localStorage. Ini bukan pengganti keamanan server sungguhan, tapi
// cukup untuk aplikasi internal satu perangkat seperti ini.
function hashPassword(plain){
  if(window.crypto && window.crypto.subtle){
    var enc = new TextEncoder().encode(plain);
    return window.crypto.subtle.digest('SHA-256', enc).then(function(buf){
      return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0'+b.toString(16)).slice(-2); }).join('');
    });
  }
  // Fallback kalau Web Crypto tidak tersedia (browser sangat lama / http non-secure)
  return Promise.resolve('plain:' + plain);
}

function showAuthView(name){
  ['splash','login','signup','success','app'].forEach(function(v){
    var el = document.getElementById('view-'+v);
    if(el) el.style.display = (v === name) ? 'flex' : 'none';
  });
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

  hashPassword(password).then(function(hash){
    var user = getUsers().filter(function(u){ return u.username === username; })[0];
    if(!user || user.passwordHash !== hash){
      errEl.textContent = '❌ Username atau password salah, atau akun belum terdaftar.';
      errEl.style.display = 'block';
      return;
    }
    saveSession({username: user.username, nama: user.nama, warung: user.warung});
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    showSuccessThenEnter('Login Berhasil!', 'Selamat bekerja, ' + (user.nama || user.username) + '!');
  });
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
  if(users.some(function(u){ return u.username === username; })){
    errEl.textContent = '❌ Username sudah dipakai, pilih username lain.';
    errEl.style.display = 'block'; return;
  }

  hashPassword(password).then(function(hash){
    users.push({username: username, passwordHash: hash, nama: nama, warung: warung});
    saveUsers(users);
    saveSession({username: username, nama: nama, warung: warung});
    showSuccessThenEnter('Pendaftaran Sukses!', 'Warung "' + warung + '" siap dikelola.');
  });
}

function showSuccessThenEnter(title, sub){
  document.getElementById('success-title').textContent = title;
  document.getElementById('success-sub').textContent = sub;
  showAuthView('success');
  setTimeout(enterApp, 900);
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
  DB.loadAll()
    .then(function(){ goPage('beranda'); })
    .catch(function(err){
      document.getElementById('content').innerHTML =
        '<div class="empty-state"><div class="em">⚠️</div>' + esc(err.message || 'Gagal memuat data dari penyimpanan perangkat.') +
        '<div style="margin-top:14px;"><button class="btn btn-outline btn-sm" onclick="enterApp()">Coba Lagi</button></div></div>';
    });
}

function getGreeting(){
  var jam = new Date().getHours();
  if(jam < 11) return 'Selamat Pagi';
  if(jam < 15) return 'Selamat Siang';
  if(jam < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function appInit(){
  bindNav();
  showAuthView('splash');
  setTimeout(function(){
    if(isLoggedIn()){
      enterApp();
    } else {
      showAuthView('login');
    }
  }, 1200);
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
  var statsEl = document.getElementById('topbar-stats');
  closeSheet();

  if(STATE.page === 'beranda'){
    var s = STATE.session || getSession();
    title.textContent = getGreeting() + (s && s.nama ? ', ' + s.nama : '') + '!';
    sub.textContent = DB.fmtTgl(DB.todayISO()) + (s && s.warung ? ' \u00b7 ' + s.warung : '');
    el.innerHTML = renderBeranda();
    renderTopbarStats().then(function(html){ statsEl.innerHTML = html; });
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
    if(STATE.keuanganTab === 'labarugi') refreshLabaRugi();
  }
}

// Statistik pemasukan/pengeluaran/laba-rugi menyatu dalam shape header (Beranda)
function renderTopbarStats(){
  var today = DB.todayISO();
  return DB.hitungLabaRugi(today, today).then(function(lr){
    var html = '<div class="tb-stat-grid">';
    html += '<div class="tb-stat-card"><div class="tb-stat-label">Pemasukan Hari Ini</div><div class="tb-stat-val">'+DB.rp(lr.totalPemasukan)+'</div></div>';
    html += '<div class="tb-stat-card"><div class="tb-stat-label">Pengeluaran Hari Ini</div><div class="tb-stat-val neg">'+DB.rp(lr.totalPengeluaran)+'</div></div>';
    html += '</div>';
    html += '<div class="tb-lr-row"><span class="tb-lr-label">LABA / RUGI HARI INI</span>';
    html += '<span class="tb-lr-val'+(lr.labaRugi<0?' neg':'')+'">'+DB.rp(lr.labaRugi)+'</span></div>';
    return html;
  }).catch(function(err){
    return '<div class="field-hint" style="color:#fff;opacity:.8;margin-top:12px;">'+esc(err.message)+'</div>';
  });
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
  html += '<div class="field"><label>Satuan</label>'+customSelectHTML('f-satuan', satuanList(), b?b.satuan:'kg')+'</div>';
  html += '<div class="field"><label>Stok Minimum</label><input id="f-stokmin" type="number" step="any" value="'+(b?b.stokMin:'')+'" placeholder="0"></div>';
  html += '</div>';
  if(!b){
    html += '<div class="field"><label>Stok Awal</label><input id="f-stok" type="number" step="any" value="0"><div class="field-hint">Jumlah stok saat ini saat pertama kali dicatat.</div></div>';
  }
  html += '<button class="btn btn-primary" id="btn-simpan-bahan" onclick="simpanBahan('+(b?b.id:'null')+')">Simpan</button>';
  openSheet(html);
}

function simpanBahan(id){
  var obj = {
    nama: document.getElementById('f-nama').value,
    satuan: document.getElementById('f-satuan').value,
    stokMin: document.getElementById('f-stokmin').value
  };
  var btn = document.getElementById('btn-simpan-bahan');
  btn.disabled = true; btn.textContent = 'Menyimpan…';

  var task = id ? DB.updateBahan(id, obj) : (function(){ obj.stok = document.getElementById('f-stok').value; return DB.tambahBahan(obj); })();

  task.then(function(){
    toast(id ? 'Bahan baku diperbarui' : 'Bahan baku ditambahkan');
    closeSheet();
    render();
  }).catch(function(err){
    toast(err.message);
    btn.disabled = false; btn.textContent = 'Simpan';
  });
}

function konfirmasiHapusBahan(id){
  var b = DB.getBahan(id);
  if(!b) return;
  if(confirm('Hapus "'+b.nama+'" dari master data? Riwayat mutasi terkait ikut terhapus.')){
    DB.hapusBahan(id).then(function(){
      toast('Bahan baku dihapus');
      render();
    }).catch(function(err){ toast(err.message); });
  }
}

function satuanList(){
  var list = ['kg','gram','liter','ml','pcs','pack','dus','karung','tabung','ikat','lainnya'];
  return list.map(function(u){ return {value:u, label:u}; });
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

function bahanList(){
  return DB.bahan.slice().sort(function(a,b){return a.nama.localeCompare(b.nama);}).map(function(b){
    return {value:b.id, label: b.nama+' (stok: '+fmtNum(b.stok)+' '+b.satuan+')'};
  });
}

function formMasuk(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="m-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Nama Bahan</label>'+customSelectHTML('m-bahan', bahanList())+'</div>';
  html += '<div class="field-row">';
  html += '<div class="field"><label>Jumlah</label><input id="m-jumlah" type="number" step="any" placeholder="0" oninput="updateHargaSatuanPreview()"></div>';
  html += '<div class="field"><label>Total Harga Beli</label><input id="m-total" type="number" step="any" placeholder="0" oninput="updateHargaSatuanPreview()"></div>';
  html += '</div>';
  html += '<div class="field-hint" id="m-harga-satuan-hint" style="margin-bottom:10px;">Harga satuan akan dihitung otomatis.</div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="m-catatan" type="text" placeholder="Contoh: Supplier / no. nota"></div>';
  html += '<button class="btn btn-primary" id="btn-simpan-masuk" onclick="simpanMasuk()">Simpan Barang Masuk</button>';
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
  var btn = document.getElementById('btn-simpan-masuk');
  btn.disabled = true; btn.textContent = 'Menyimpan…';
  DB.tambahMutasiMasuk({
    tgl: document.getElementById('m-tgl').value,
    bahanId: document.getElementById('m-bahan').value,
    jumlah: document.getElementById('m-jumlah').value,
    totalHarga: document.getElementById('m-total').value,
    catatan: document.getElementById('m-catatan').value
  }).then(function(){
    toast('Barang masuk dicatat & stok diperbarui');
    render();
  }).catch(function(err){
    toast(err.message);
    btn.disabled = false; btn.textContent = 'Simpan Barang Masuk';
  });
}

function formKeluar(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="k-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Nama Bahan</label>'+customSelectHTML('k-bahan', bahanList())+'</div>';
  html += '<div class="field"><label>Jumlah</label><input id="k-jumlah" type="number" step="any" placeholder="0"></div>';
  html += '<div class="field"><label>Alasan</label>'+customSelectHTML('k-keterangan', ['Operasional','Rusak','Basi','Lainnya'].map(function(k){return {value:k,label:k};}))+'</div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="k-catatan" type="text" placeholder="Keterangan tambahan"></div>';
  html += '<button class="btn btn-danger" id="btn-simpan-keluar" onclick="simpanKeluar()">Simpan Barang Keluar</button>';
  html += '</div>';
  return html;
}

function simpanKeluar(){
  var btn = document.getElementById('btn-simpan-keluar');
  btn.disabled = true; btn.textContent = 'Menyimpan…';
  DB.tambahMutasiKeluar({
    tgl: document.getElementById('k-tgl').value,
    bahanId: document.getElementById('k-bahan').value,
    jumlah: document.getElementById('k-jumlah').value,
    keterangan: document.getElementById('k-keterangan').value,
    catatan: document.getElementById('k-catatan').value
  }).then(function(){
    toast('Barang keluar dicatat & stok diperbarui');
    render();
  }).catch(function(err){
    toast(err.message);
    btn.disabled = false; btn.textContent = 'Simpan Barang Keluar';
  });
}

function renderRiwayatMutasi(){
  if(!DB.mutasi.length) return '<div class="empty-state"><div class="em"></div>Belum ada riwayat mutasi.</div>';
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
    DB.hapusMutasi(id).then(function(){
      toast('Mutasi dihapus, stok disesuaikan');
      render();
    }).catch(function(err){ toast(err.message); });
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
  else html += '<div id="labarugi-body">' + labaRugiSkeleton() + '</div>';

  return html;
}

function setKeuanganTab(t){ STATE.keuanganTab = t; render(); }

function renderPemasukan(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="p-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Shift / Periode</label>'+customSelectHTML('p-shift', ['Harian','Pagi','Siang','Malam'].map(function(s){return {value:s,label:s};}))+'</div>';
  html += '<div class="field"><label>Total Penjualan Kotor</label><input id="p-jumlah" type="number" step="any" placeholder="0"></div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="p-catatan" type="text" placeholder="Contoh: termasuk pesanan online"></div>';
  html += '<button class="btn btn-primary" id="btn-simpan-pemasukan" onclick="simpanPemasukan()">Simpan Pemasukan</button>';
  html += '</div>';

  html += '<div class="sec-title">Riwayat Pemasukan</div>';
  if(!DB.pemasukan.length){
    html += '<div class="empty-state"><div class="em"></div>Belum ada data pemasukan.</div>';
  } else {
    DB.pemasukan.forEach(function(p){
      html += '<div class="mutasi-item">';
      html += '<div class="mutasi-dot masuk"></div>';
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
  var btn = document.getElementById('btn-simpan-pemasukan');
  btn.disabled = true; btn.textContent = 'Menyimpan…';
  DB.tambahPemasukan({
    tgl: document.getElementById('p-tgl').value,
    shift: document.getElementById('p-shift').value,
    jumlah: document.getElementById('p-jumlah').value,
    catatan: document.getElementById('p-catatan').value
  }).then(function(){
    toast('Pemasukan dicatat');
    render();
  }).catch(function(err){
    toast(err.message);
    btn.disabled = false; btn.textContent = 'Simpan Pemasukan';
  });
}

function konfirmasiHapusPemasukan(id){
  if(confirm('Hapus catatan pemasukan ini?')){
    DB.hapusPemasukan(id).then(function(){ toast('Pemasukan dihapus'); render(); })
      .catch(function(err){ toast(err.message); });
  }
}

function renderPengeluaran(){
  var html = '<div class="card">';
  html += '<div class="field"><label>Tanggal</label><input id="e-tgl" type="date" value="'+DB.todayISO()+'"></div>';
  html += '<div class="field"><label>Kategori</label>'+customSelectHTML('e-kategori', ['Listrik','Air','Gaji Karyawan','Sewa Tempat','Transportasi','Lainnya'].map(function(k){return {value:k,label:k};}))+'</div>';
  html += '<div class="field"><label>Jumlah</label><input id="e-jumlah" type="number" step="any" placeholder="0"></div>';
  html += '<div class="field"><label>Catatan (opsional)</label><input id="e-catatan" type="text" placeholder="Keterangan tambahan"></div>';
  html += '<button class="btn btn-primary" id="btn-simpan-pengeluaran" onclick="simpanPengeluaran()">Simpan Pengeluaran</button>';
  html += '</div>';

  html += '<div class="sec-title">Belanja Bahan (Otomatis dari Barang Masuk)</div>';
  var belanja = DB.mutasi.filter(function(m){ return m.tipe==='masuk'; });
  if(!belanja.length){
    html += '<div class="empty-state"><div class="em"></div>Belum ada belanja bahan tercatat.</div>';
  } else {
    belanja.slice(0,10).forEach(function(m){
      html += '<div class="mutasi-item">';
      html += '<div class="mutasi-dot keluar"></div>';
      html += '<div class="mutasi-mid"><div class="mutasi-nama">'+esc(m.bahanNama)+'</div>';
      html += '<div class="mutasi-sub">'+DB.fmtTgl(m.tgl)+' &middot; Otomatis dari Barang Masuk</div></div>';
      html += '<div class="mutasi-val keluar">'+DB.rp(m.totalHarga)+'</div>';
      html += '</div>';
    });
    if(belanja.length>10) html += '<div class="field-hint" style="text-align:center;margin:6px 0 14px;">+'+(belanja.length-10)+' transaksi belanja bahan lainnya (lihat Mutasi Stok &rarr; Riwayat)</div>';
  }

  html += '<div class="sec-title">Pengeluaran Operasional Lain</div>';
  if(!DB.pengeluaranManual.length){
    html += '<div class="empty-state"><div class="em"></div>Belum ada pengeluaran operasional lain.</div>';
  } else {
    DB.pengeluaranManual.forEach(function(p){
      html += '<div class="mutasi-item">';
      html += '<div class="mutasi-dot keluar"></div>';
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
  var btn = document.getElementById('btn-simpan-pengeluaran');
  btn.disabled = true; btn.textContent = 'Menyimpan…';
  DB.tambahPengeluaranManual({
    tgl: document.getElementById('e-tgl').value,
    kategori: document.getElementById('e-kategori').value,
    jumlah: document.getElementById('e-jumlah').value,
    catatan: document.getElementById('e-catatan').value
  }).then(function(){
    toast('Pengeluaran dicatat');
    render();
  }).catch(function(err){
    toast(err.message);
    btn.disabled = false; btn.textContent = 'Simpan Pengeluaran';
  });
}

function konfirmasiHapusPengeluaran(id){
  if(confirm('Hapus catatan pengeluaran ini?')){
    DB.hapusPengeluaranManual(id).then(function(){ toast('Pengeluaran dihapus'); render(); })
      .catch(function(err){ toast(err.message); });
  }
}

function labaRugiSkeleton(){
  var html = '<div class="chip-row">';
  [['hari','Hari Ini'],['minggu','Minggu Ini'],['bulan','Bulan Ini']].forEach(function(r){
    html += '<div class="chip '+(STATE.labaRange===r[0]?'active':'')+'" onclick="setLabaRange(\''+r[0]+'\')">'+r[1]+'</div>';
  });
  html += '</div><div class="card"><div class="empty-state" style="padding:14px;">Memuat data…</div></div>';
  return html;
}

function refreshLabaRugi(){
  var range = getRange(STATE.labaRange);
  DB.hitungLabaRugi(range.start, range.end).then(function(lr){
    var el = document.getElementById('labarugi-body');
    if(!el) return; // pindah tab sebelum data selesai dimuat
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
    el.innerHTML = html;
  }).catch(function(err){
    var el = document.getElementById('labarugi-body');
    if(el) el.innerHTML = '<div class="empty-state">'+esc(err.message)+'</div>';
  });
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

// ═══════════════════ DROPDOWN KUSTOM (bukan <select> bawaan) ═══════════════════
// options: [{value, label}]  |  selected: value awal
function customSelectHTML(id, options, selected){
  if(selected === undefined || selected === null || selected === ''){
    selected = options.length ? options[0].value : '';
  }
  var selectedOpt = options.filter(function(o){ return String(o.value) === String(selected); })[0] || options[0] || {value:'', label:''};
  var html = '<div class="csel" id="csel-'+id+'">';
  html += '<input type="hidden" id="'+id+'" value="'+esc(selectedOpt.value)+'">';
  html += '<div class="csel-trigger" id="csel-trigger-'+id+'" onclick="toggleSelect(\''+id+'\')">';
  html += '<span class="csel-label" id="csel-label-'+id+'">'+esc(selectedOpt.label)+'</span>';
  html += '<svg class="csel-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 8 10 13 15 8"/></svg>';
  html += '</div>';
  html += '<div class="csel-list" id="csel-list-'+id+'">';
  options.forEach(function(o){
    var isSel = String(o.value) === String(selectedOpt.value);
    html += '<div class="csel-opt'+(isSel?' sel':'')+'" onclick="pickSelect(\''+id+'\',\''+String(o.value).replace(/'/g,"\\'")+'\',this)">'+esc(o.label)+'</div>';
  });
  html += '</div></div>';
  return html;
}

function toggleSelect(id){
  var list = document.getElementById('csel-list-'+id);
  var trigger = document.getElementById('csel-trigger-'+id);
  var wasOpen = list.classList.contains('open');
  closeAllSelects();
  if(!wasOpen){
    list.classList.add('open');
    trigger.classList.add('open');
  }
}

function pickSelect(id, value, node){
  document.getElementById(id).value = value;
  document.getElementById('csel-label-'+id).textContent = node.textContent;
  var list = document.getElementById('csel-list-'+id);
  Array.prototype.forEach.call(list.querySelectorAll('.csel-opt'), function(o){ o.classList.remove('sel'); });
  node.classList.add('sel');
  closeAllSelects();
}

function closeAllSelects(){
  document.querySelectorAll('.csel-list.open').forEach(function(l){ l.classList.remove('open'); });
  document.querySelectorAll('.csel-trigger.open').forEach(function(t){ t.classList.remove('open'); });
}

document.addEventListener('click', function(e){
  if(!e.target.closest || !e.target.closest('.csel')){
    closeAllSelects();
  }
});
