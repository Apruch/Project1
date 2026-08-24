// ═══════════════════════════════════════════════════════════════
// db.js — Data layer, tersimpan di localStorage (penyimpanan perangkat)
// Tidak butuh server/PHP — murni jalan di browser, cocok untuk
// GitHub Pages atau hosting statis lainnya.
// Modul: Bahan Baku, Mutasi Stok, Manajemen Keuangan
// ═══════════════════════════════════════════════════════════════

var LS_KEY_DATA = 'warungku_data_v1';

var DB = {
  bahan: [],
  mutasi: [],
  pemasukan: [],
  pengeluaranManual: [],
  _uid: 100,

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

  nextId: function(){ return ++this._uid; },

  // ── Muat data dari localStorage (dipanggil saat masuk aplikasi) ──
  loadAll: function(){
    var self = this;
    return new Promise(function(resolve){
      try{
        var raw = localStorage.getItem(LS_KEY_DATA);
        if(raw){
          var saved = JSON.parse(raw);
          self.bahan = saved.bahan || [];
          self.mutasi = saved.mutasi || [];
          self.pemasukan = saved.pemasukan || [];
          self.pengeluaranManual = saved.pengeluaranManual || [];
          self._uid = saved._uid || 100;
        } else {
          // Pertama kali dibuka: isi contoh data awal
          self.bahan = seedBahan();
          self._uid = 100 + self.bahan.length;
          self.mutasi = [];
          self.pemasukan = [];
          self.pengeluaranManual = [];
          persist();
        }
      }catch(e){ /* biarkan default array kosong kalau data korup */ }
      resolve();
    });
  },

  // ── Bahan Baku (Master Data) ─────────────────────────────
  tambahBahan: function(obj){
    var self = this;
    return new Promise(function(resolve, reject){
      var nama = (obj.nama||'').trim();
      if(!nama) return reject(new Error('Nama bahan wajib diisi'));
      var b = {
        id: self.nextId(),
        nama: nama,
        satuan: obj.satuan || 'pcs',
        stok: parseFloat(obj.stok) || 0,
        stokMin: parseFloat(obj.stokMin) || 0
      };
      self.bahan.push(b);
      persist();
      resolve(b);
    });
  },

  updateBahan: function(id, obj){
    var self = this;
    return new Promise(function(resolve, reject){
      var b = self.getBahan(id);
      if(!b) return reject(new Error('Bahan tidak ditemukan'));
      b.nama = obj.nama !== undefined ? (obj.nama||b.nama).trim() : b.nama;
      b.satuan = obj.satuan || b.satuan;
      b.stokMin = obj.stokMin !== undefined ? (parseFloat(obj.stokMin)||0) : b.stokMin;
      if(obj.stok !== undefined) b.stok = parseFloat(obj.stok) || 0;
      self.mutasi.forEach(function(m){ if(m.bahanId === id){ m.bahanNama = b.nama; m.satuan = b.satuan; } });
      persist();
      resolve();
    });
  },

  hapusBahan: function(id){
    var self = this;
    return new Promise(function(resolve){
      self.bahan = self.bahan.filter(function(b){ return b.id !== Number(id); });
      self.mutasi = self.mutasi.filter(function(m){ return m.bahanId !== Number(id); });
      persist();
      resolve();
    });
  },

  // ── Mutasi Stok ───────────────────────────────────────────
  tambahMutasiMasuk: function(obj){
    var self = this;
    return new Promise(function(resolve, reject){
      var b = self.getBahan(obj.bahanId);
      if(!b) return reject(new Error('Bahan tidak ditemukan'));
      var jumlah = parseFloat(obj.jumlah) || 0;
      var totalHarga = parseFloat(obj.totalHarga) || 0;
      if(jumlah <= 0) return reject(new Error('Jumlah harus lebih dari 0'));

      b.stok += jumlah;
      var m = {
        id: self.nextId(),
        tgl: obj.tgl || self.todayISO(),
        tipe: 'masuk',
        bahanId: b.id,
        bahanNama: b.nama,
        satuan: b.satuan,
        jumlah: jumlah,
        totalHarga: totalHarga,
        hargaSatuan: jumlah > 0 ? (totalHarga / jumlah) : 0,
        catatan: obj.catatan || ''
      };
      self.mutasi.unshift(m);
      persist();
      resolve(m);
    });
  },

  tambahMutasiKeluar: function(obj){
    var self = this;
    return new Promise(function(resolve, reject){
      var b = self.getBahan(obj.bahanId);
      if(!b) return reject(new Error('Bahan tidak ditemukan'));
      var jumlah = parseFloat(obj.jumlah) || 0;
      if(jumlah <= 0) return reject(new Error('Jumlah harus lebih dari 0'));

      b.stok = Math.max(0, b.stok - jumlah);
      var m = {
        id: self.nextId(),
        tgl: obj.tgl || self.todayISO(),
        tipe: 'keluar',
        bahanId: b.id,
        bahanNama: b.nama,
        satuan: b.satuan,
        jumlah: jumlah,
        keterangan: obj.keterangan || 'Operasional',
        catatan: obj.catatan || ''
      };
      self.mutasi.unshift(m);
      persist();
      resolve(m);
    });
  },

  hapusMutasi: function(id){
    var self = this;
    return new Promise(function(resolve){
      var m = self.mutasi.find(function(x){ return x.id === Number(id); });
      if(m){
        var b = self.getBahan(m.bahanId);
        if(b){
          if(m.tipe === 'masuk') b.stok = Math.max(0, b.stok - m.jumlah);
          else b.stok = b.stok + m.jumlah;
        }
        self.mutasi = self.mutasi.filter(function(x){ return x.id !== Number(id); });
        persist();
      }
      resolve();
    });
  },

  // ── Keuangan ──────────────────────────────────────────────
  tambahPemasukan: function(obj){
    var self = this;
    return new Promise(function(resolve, reject){
      var jumlah = parseFloat(obj.jumlah) || 0;
      if(jumlah <= 0) return reject(new Error('Jumlah penjualan harus lebih dari 0'));
      var p = {
        id: self.nextId(),
        tgl: obj.tgl || self.todayISO(),
        shift: obj.shift || 'Harian',
        jumlah: jumlah,
        catatan: obj.catatan || ''
      };
      self.pemasukan.unshift(p);
      persist();
      resolve(p);
    });
  },

  hapusPemasukan: function(id){
    var self = this;
    return new Promise(function(resolve){
      self.pemasukan = self.pemasukan.filter(function(p){ return p.id !== Number(id); });
      persist();
      resolve();
    });
  },

  tambahPengeluaranManual: function(obj){
    var self = this;
    return new Promise(function(resolve, reject){
      var jumlah = parseFloat(obj.jumlah) || 0;
      if(jumlah <= 0) return reject(new Error('Jumlah pengeluaran harus lebih dari 0'));
      var p = {
        id: self.nextId(),
        tgl: obj.tgl || self.todayISO(),
        kategori: obj.kategori || 'Lainnya',
        jumlah: jumlah,
        catatan: obj.catatan || ''
      };
      self.pengeluaranManual.unshift(p);
      persist();
      resolve(p);
    });
  },

  hapusPengeluaranManual: function(id){
    var self = this;
    return new Promise(function(resolve){
      self.pengeluaranManual = self.pengeluaranManual.filter(function(p){ return p.id !== Number(id); });
      persist();
      resolve();
    });
  },

  hitungLabaRugi: function(start, end){
    var self = this;
    return new Promise(function(resolve){
      var pemasukanList = self.pemasukan.filter(function(p){ return p.tgl >= start && p.tgl <= end; });
      var belanjaList = self.mutasi.filter(function(m){ return m.tipe === 'masuk' && m.tgl >= start && m.tgl <= end; });
      var manualList = self.pengeluaranManual.filter(function(p){ return p.tgl >= start && p.tgl <= end; });

      var totalPemasukan = pemasukanList.reduce(function(s,p){ return s+p.jumlah; }, 0);
      var totalBelanjaBahan = belanjaList.reduce(function(s,m){ return s+(m.totalHarga||0); }, 0);
      var totalPengeluaranManual = manualList.reduce(function(s,p){ return s+p.jumlah; }, 0);
      var totalPengeluaran = totalBelanjaBahan + totalPengeluaranManual;

      resolve({
        totalPemasukan: totalPemasukan,
        totalBelanjaBahan: totalBelanjaBahan,
        totalPengeluaranManual: totalPengeluaranManual,
        totalPengeluaran: totalPengeluaran,
        labaRugi: totalPemasukan - totalPengeluaran
      });
    });
  }
};

function seedBahan(){
  return [
    {id:101, nama:'Beras Premium',  satuan:'kg',     stok:45,  stokMin:15},
    {id:102, nama:'Minyak Goreng',  satuan:'liter',  stok:8,   stokMin:10},
    {id:103, nama:'Gula Pasir',     satuan:'kg',     stok:22,  stokMin:8},
    {id:104, nama:'Tepung Terigu',  satuan:'kg',     stok:5,   stokMin:6},
    {id:105, nama:'Telur Ayam',     satuan:'kg',     stok:14,  stokMin:5},
    {id:106, nama:'Ayam Potong',    satuan:'kg',     stok:0,   stokMin:4},
    {id:107, nama:'Bawang Merah',   satuan:'kg',     stok:3.5, stokMin:2},
    {id:108, nama:'Gas LPG 3kg',    satuan:'tabung', stok:6,   stokMin:3}
  ];
}

function persist(){
  try{
    localStorage.setItem(LS_KEY_DATA, JSON.stringify({
      bahan: DB.bahan,
      mutasi: DB.mutasi,
      pemasukan: DB.pemasukan,
      pengeluaranManual: DB.pengeluaranManual,
      _uid: DB._uid
    }));
  }catch(e){ console.warn('Gagal menyimpan data ke perangkat:', e); }
}

// ── Backup / Reset (karena tidak ada database server untuk dicek manual) ──
function eksporData(){
  var blob = new Blob([JSON.stringify({
    bahan: DB.bahan, mutasi: DB.mutasi, pemasukan: DB.pemasukan, pengeluaranManual: DB.pengeluaranManual
  }, null, 2)], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'warungku-backup-'+DB.todayISO()+'.json'; a.click();
  URL.revokeObjectURL(url);
}

function resetData(){
  if(!confirm('Reset semua data (bahan, mutasi, keuangan) ke data awal? Tindakan ini tidak bisa dibatalkan.')) return;
  localStorage.removeItem(LS_KEY_DATA);
  location.reload();
}
