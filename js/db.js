// ═══════════════════════════════════════════════════════════════
// db.js — Data layer, terhubung ke backend PHP + MySQL (XAMPP)
// Modul: Bahan Baku, Mutasi Stok, Manajemen Keuangan
// ═══════════════════════════════════════════════════════════════

var API_BASE = 'api/';

var DB = {
  bahan: [],
  mutasi: [],
  pemasukan: [],
  pengeluaranManual: [],

  getBahan: function(id){ return this.bahan.find(function(b){ return b.id === Number(id); }); },

  statusStok: function(b){
    if(b.stok <= 0) return 'habis';
    if(b.stok <= b.stokMin) return 'kritis';
    return 'aman';
  },

  rp: function(n){ return 'Rp ' + Number(n||0).toLocaleString('id-ID'); },

  todayISO: function(){
    var d = new Date();
    var m = ('0'+(d.getMonth()+1)).slice(-2), day = ('0'+d.getDate()).slice(-2);
    return d.getFullYear()+'-'+m+'-'+day;
  },

  fmtTgl: function(iso){
    if(!iso) return '—';
    var BL=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    var p = iso.split('-');
    return parseInt(p[2],10)+' '+BL[parseInt(p[1],10)-1]+' '+p[0];
  },

  // ── Muat semua data dari server (dipanggil saat masuk aplikasi) ──
  loadAll: function(){
    var self = this;
    return Promise.all([
      apiGet('bahan.php'),
      apiGet('mutasi.php'),
      apiGet('keuangan.php?resource=pemasukan'),
      apiGet('keuangan.php?resource=pengeluaran')
    ]).then(function(res){
      self.bahan = res[0].data || [];
      self.mutasi = res[1].data || [];
      self.pemasukan = res[2].data || [];
      self.pengeluaranManual = res[3].data || [];
    });
  },

  // ── Bahan Baku (Master Data) ─────────────────────────────
  tambahBahan: function(obj){
    var self = this;
    if(!(obj.nama||'').trim()) return Promise.reject(new Error('Nama bahan wajib diisi'));
    return apiPost('bahan.php', obj).then(function(){ return self.reloadBahan(); });
  },

  updateBahan: function(id, obj){
    var self = this;
    obj.id = id;
    return apiPut('bahan.php', obj).then(function(){
      return Promise.all([self.reloadBahan(), self.reloadMutasi()]);
    });
  },

  hapusBahan: function(id){
    var self = this;
    return apiDelete('bahan.php?id=' + id).then(function(){ return self.reloadBahan(); });
  },

  reloadBahan: function(){
    var self = this;
    return apiGet('bahan.php').then(function(res){ self.bahan = res.data || []; });
  },

  // ── Mutasi Stok ───────────────────────────────────────────
  tambahMutasiMasuk: function(obj){
    var self = this;
    obj.tipe = 'masuk';
    if(!(parseFloat(obj.jumlah) > 0)) return Promise.reject(new Error('Jumlah harus lebih dari 0'));
    return apiPost('mutasi.php', obj).then(function(){
      return Promise.all([self.reloadMutasi(), self.reloadBahan()]);
    });
  },

  tambahMutasiKeluar: function(obj){
    var self = this;
    obj.tipe = 'keluar';
    if(!(parseFloat(obj.jumlah) > 0)) return Promise.reject(new Error('Jumlah harus lebih dari 0'));
    return apiPost('mutasi.php', obj).then(function(){
      return Promise.all([self.reloadMutasi(), self.reloadBahan()]);
    });
  },

  hapusMutasi: function(id){
    var self = this;
    return apiDelete('mutasi.php?id=' + id).then(function(){
      return Promise.all([self.reloadMutasi(), self.reloadBahan()]);
    });
  },

  reloadMutasi: function(){
    var self = this;
    return apiGet('mutasi.php').then(function(res){ self.mutasi = res.data || []; });
  },

  // ── Keuangan ──────────────────────────────────────────────
  tambahPemasukan: function(obj){
    var self = this;
    if(!(parseFloat(obj.jumlah) > 0)) return Promise.reject(new Error('Jumlah penjualan harus lebih dari 0'));
    return apiPost('keuangan.php?resource=pemasukan', obj).then(function(){ return self.reloadPemasukan(); });
  },

  hapusPemasukan: function(id){
    var self = this;
    return apiDelete('keuangan.php?resource=pemasukan&id=' + id).then(function(){ return self.reloadPemasukan(); });
  },

  reloadPemasukan: function(){
    var self = this;
    return apiGet('keuangan.php?resource=pemasukan').then(function(res){ self.pemasukan = res.data || []; });
  },

  tambahPengeluaranManual: function(obj){
    var self = this;
    if(!(parseFloat(obj.jumlah) > 0)) return Promise.reject(new Error('Jumlah pengeluaran harus lebih dari 0'));
    return apiPost('keuangan.php?resource=pengeluaran', obj).then(function(){ return self.reloadPengeluaran(); });
  },

  hapusPengeluaranManual: function(id){
    var self = this;
    return apiDelete('keuangan.php?resource=pengeluaran&id=' + id).then(function(){ return self.reloadPengeluaran(); });
  },

  reloadPengeluaran: function(){
    var self = this;
    return apiGet('keuangan.php?resource=pengeluaran').then(function(res){ self.pengeluaranManual = res.data || []; });
  },

  hitungLabaRugi: function(start, end){
    return apiGet('keuangan.php?resource=labarugi&start=' + start + '&end=' + end).then(function(res){
      return res.data;
    });
  }
};

// ═══════════════════ HELPER FETCH KE API PHP ═══════════════════
function apiGet(path){
  return fetch(API_BASE + path)
    .then(handleApiResponse)
    .catch(handleApiNetworkError);
}
function apiPost(path, body){
  return fetch(API_BASE + path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  }).then(handleApiResponse).catch(handleApiNetworkError);
}
function apiPut(path, body){
  return fetch(API_BASE + path, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  }).then(handleApiResponse).catch(handleApiNetworkError);
}
function apiDelete(path){
  return fetch(API_BASE + path, { method: 'DELETE' })
    .then(handleApiResponse).catch(handleApiNetworkError);
}

function handleApiResponse(resp){
  return resp.json().then(function(data){
    if(!resp.ok || data.success === false){
      throw new Error(data.error || 'Terjadi kesalahan pada server.');
    }
    return data;
  });
}
function handleApiNetworkError(err){
  if(err instanceof TypeError){
    throw new Error('Tidak dapat terhubung ke server. Pastikan XAMPP (Apache & MySQL) sudah dijalankan.');
  }
  throw err;
}
