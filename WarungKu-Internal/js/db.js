// ═══════════════════════════════════════════════════════════════
// db.js — Data layer (localStorage) untuk WarungKu Internal
// Modul: Bahan Baku, Mutasi Stok, Manajemen Keuangan
// ═══════════════════════════════════════════════════════════════

var LS_KEY = 'warungku_internal_v1';

var DB = {
  bahan: [
    {id:1, nama:'Beras Premium',        satuan:'kg',  stok:45,  stokMin:15},
    {id:2, nama:'Minyak Goreng',        satuan:'liter',stok:8,  stokMin:10},
    {id:3, nama:'Gula Pasir',           satuan:'kg',  stok:22,  stokMin:8},
    {id:4, nama:'Tepung Terigu',        satuan:'kg',  stok:5,   stokMin:6},
    {id:5, nama:'Telur Ayam',           satuan:'kg',  stok:14,  stokMin:5},
    {id:6, nama:'Ayam Potong',          satuan:'kg',  stok:0,   stokMin:4},
    {id:7, nama:'Bawang Merah',         satuan:'kg',  stok:3.5, stokMin:2},
    {id:8, nama:'Gas LPG 3kg',          satuan:'tabung',stok:6, stokMin:3},
  ],
  mutasi: [
    // {id, tgl:'YYYY-MM-DD', tipe:'masuk'|'keluar', bahanId, bahanNama, satuan, jumlah, totalHarga, hargaSatuan, keterangan, catatan}
  ],
  pemasukan: [
    // {id, tgl:'YYYY-MM-DD', shift, jumlah, catatan}
  ],
  pengeluaranManual: [
    // {id, tgl:'YYYY-MM-DD', kategori, jumlah, catatan}
  ],
  _uid: 100,

  nextId: function(){ return ++this._uid; },

  getBahan: function(id){ return this.bahan.find(function(b){ return b.id === id; }); },

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

  // ── Bahan Baku (Master Data) ─────────────────────────────
  tambahBahan: function(obj){
    var nama = (obj.nama||'').trim();
    if(!nama) throw new Error('Nama bahan wajib diisi');
    var b = {
      id: this.nextId(),
      nama: nama,
      satuan: obj.satuan || 'pcs',
      stok: parseFloat(obj.stok) || 0,
      stokMin: parseFloat(obj.stokMin) || 0
    };
    this.bahan.push(b);
    save();
    return b;
  },

  updateBahan: function(id, obj){
    var b = this.getBahan(id); if(!b) return;
    b.nama = (obj.nama||b.nama).trim();
    b.satuan = obj.satuan || b.satuan;
    b.stokMin = obj.stokMin !== undefined ? (parseFloat(obj.stokMin)||0) : b.stokMin;
    if(obj.stok !== undefined) b.stok = parseFloat(obj.stok) || 0;
    // Sinkronkan nama pada riwayat mutasi yang sudah ada
    this.mutasi.forEach(function(m){ if(m.bahanId === id){ m.bahanNama = b.nama; m.satuan = b.satuan; } });
    save();
  },

  hapusBahan: function(id){
    this.bahan = this.bahan.filter(function(b){ return b.id !== id; });
    save();
  },

  // ── Mutasi Stok ───────────────────────────────────────────
  tambahMutasiMasuk: function(obj){
    var b = this.getBahan(parseInt(obj.bahanId,10));
    if(!b) throw new Error('Bahan tidak ditemukan');
    var jumlah = parseFloat(obj.jumlah) || 0;
    var totalHarga = parseFloat(obj.totalHarga) || 0;
    if(jumlah <= 0) throw new Error('Jumlah harus lebih dari 0');
    b.stok += jumlah;
    var m = {
      id: this.nextId(),
      tgl: obj.tgl || this.todayISO(),
      tipe: 'masuk',
      bahanId: b.id,
      bahanNama: b.nama,
      satuan: b.satuan,
      jumlah: jumlah,
      totalHarga: totalHarga,
      hargaSatuan: jumlah > 0 ? (totalHarga / jumlah) : 0,
      catatan: obj.catatan || ''
    };
    this.mutasi.unshift(m);
    save();
    return m;
  },

  tambahMutasiKeluar: function(obj){
    var b = this.getBahan(parseInt(obj.bahanId,10));
    if(!b) throw new Error('Bahan tidak ditemukan');
    var jumlah = parseFloat(obj.jumlah) || 0;
    if(jumlah <= 0) throw new Error('Jumlah harus lebih dari 0');
    b.stok = Math.max(0, b.stok - jumlah);
    var m = {
      id: this.nextId(),
      tgl: obj.tgl || this.todayISO(),
      tipe: 'keluar',
      bahanId: b.id,
      bahanNama: b.nama,
      satuan: b.satuan,
      jumlah: jumlah,
      keterangan: obj.keterangan || 'Operasional',
      catatan: obj.catatan || ''
    };
    this.mutasi.unshift(m);
    save();
    return m;
  },

  hapusMutasi: function(id){
    var m = this.mutasi.find(function(x){ return x.id === id; });
    if(!m) return;
    var b = this.getBahan(m.bahanId);
    if(b){
      // Kembalikan stok seperti sebelum mutasi ini dicatat
      if(m.tipe === 'masuk') b.stok = Math.max(0, b.stok - m.jumlah);
      else b.stok = b.stok + m.jumlah;
    }
    this.mutasi = this.mutasi.filter(function(x){ return x.id !== id; });
    save();
  },

  // ── Keuangan ──────────────────────────────────────────────
  tambahPemasukan: function(obj){
    var jumlah = parseFloat(obj.jumlah) || 0;
    if(jumlah <= 0) throw new Error('Jumlah penjualan harus lebih dari 0');
    var p = {
      id: this.nextId(),
      tgl: obj.tgl || this.todayISO(),
      shift: obj.shift || 'Harian',
      jumlah: jumlah,
      catatan: obj.catatan || ''
    };
    this.pemasukan.unshift(p);
    save();
    return p;
  },

  hapusPemasukan: function(id){
    this.pemasukan = this.pemasukan.filter(function(p){ return p.id !== id; });
    save();
  },

  tambahPengeluaranManual: function(obj){
    var jumlah = parseFloat(obj.jumlah) || 0;
    if(jumlah <= 0) throw new Error('Jumlah pengeluaran harus lebih dari 0');
    var p = {
      id: this.nextId(),
      tgl: obj.tgl || this.todayISO(),
      kategori: obj.kategori || 'Lainnya',
      jumlah: jumlah,
      catatan: obj.catatan || ''
    };
    this.pengeluaranManual.unshift(p);
    save();
    return p;
  },

  hapusPengeluaranManual: function(id){
    this.pengeluaranManual = this.pengeluaranManual.filter(function(p){ return p.id !== id; });
    save();
  },

  // Pengeluaran belanja bahan diambil otomatis dari mutasi "masuk"
  belanjaBahanDalamRentang: function(start, end){
    return this.mutasi.filter(function(m){
      return m.tipe === 'masuk' && m.tgl >= start && m.tgl <= end;
    });
  },

  pengeluaranManualDalamRentang: function(start, end){
    return this.pengeluaranManual.filter(function(p){ return p.tgl >= start && p.tgl <= end; });
  },

  pemasukanDalamRentang: function(start, end){
    return this.pemasukan.filter(function(p){ return p.tgl >= start && p.tgl <= end; });
  },

  hitungLabaRugi: function(start, end){
    var pemasukanList = this.pemasukanDalamRentang(start, end);
    var belanjaList = this.belanjaBahanDalamRentang(start, end);
    var manualList = this.pengeluaranManualDalamRentang(start, end);

    var totalPemasukan = pemasukanList.reduce(function(s,p){ return s+p.jumlah; }, 0);
    var totalBelanjaBahan = belanjaList.reduce(function(s,m){ return s+(m.totalHarga||0); }, 0);
    var totalPengeluaranManual = manualList.reduce(function(s,p){ return s+p.jumlah; }, 0);
    var totalPengeluaran = totalBelanjaBahan + totalPengeluaranManual;

    return {
      totalPemasukan: totalPemasukan,
      totalBelanjaBahan: totalBelanjaBahan,
      totalPengeluaranManual: totalPengeluaranManual,
      totalPengeluaran: totalPengeluaran,
      labaRugi: totalPemasukan - totalPengeluaran,
      pemasukanList: pemasukanList,
      belanjaList: belanjaList,
      manualList: manualList
    };
  }
};

function save(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify({
      bahan: DB.bahan,
      mutasi: DB.mutasi,
      pemasukan: DB.pemasukan,
      pengeluaranManual: DB.pengeluaranManual,
      _uid: DB._uid
    }));
  }catch(e){ console.warn('Gagal menyimpan data:', e); }
}

function load(){
  try{
    var raw = localStorage.getItem(LS_KEY);
    if(!raw) return false;
    var saved = JSON.parse(raw);
    if(saved.bahan) DB.bahan = saved.bahan;
    if(saved.mutasi) DB.mutasi = saved.mutasi;
    if(saved.pemasukan) DB.pemasukan = saved.pemasukan;
    if(saved.pengeluaranManual) DB.pengeluaranManual = saved.pengeluaranManual;
    if(saved._uid) DB._uid = saved._uid;
    return true;
  }catch(e){ console.warn('Gagal memuat data:', e); return false; }
}

function resetData(){
  if(!confirm('Reset semua data ke data awal? Tindakan ini tidak bisa dibatalkan.')) return;
  localStorage.removeItem(LS_KEY);
  location.reload();
}

function eksporData(){
  var blob = new Blob([JSON.stringify({
    bahan: DB.bahan, mutasi: DB.mutasi, pemasukan: DB.pemasukan, pengeluaranManual: DB.pengeluaranManual
  }, null, 2)], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'warungku-backup-'+DB.todayISO()+'.json'; a.click();
  URL.revokeObjectURL(url);
}

load();
