// controllers/creditController.js
const { v4: uuidv4 } = require('uuid');
const googleSheetService = require('../services/googleSheet.service');

// Helper: Konversi data array (baris) ke array objek
function parseRows(rows) {
  // Asumsi baris pertama adalah header, sehingga data mulai dari baris kedua
  if (!rows || rows.length < 2) return [];
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const [id, nama, deskripsi, tanggal, link] = rows[i];
    data.push({ id, nama, deskripsi, tanggal, link, rowNumber: i + 1 });
  }
  return data;
}

// Helper: Filter data berdasarkan rentang tanggal
function filterByDate(data, startDate, endDate) {
  return data.filter(item => {
    const itemDate = new Date(item.tanggal);
    return (!startDate || itemDate >= new Date(startDate)) &&
           (!endDate || itemDate <= new Date(endDate));
  });
}

module.exports = {
  // Endpoint Read: Tampilkan semua data atau filter berdasarkan tanggal
  async read(req, res) {
    try {
      const allRows = await googleSheetService.readData();
      // Jika terdapat header, pisahkan header
      let header = [];
      if (allRows.length > 0) {
        header = allRows[0];
      }
      const data = parseRows(allRows);
      // Filter jika terdapat query parameter start_date dan end_date
      const { start_date, end_date } = req.query;
      const filteredData = filterByDate(data, start_date, end_date);
      res.json(filteredData);
    } catch (error) {
      res.status(500).json({ message: 'Error membaca data', error: error.message });
    }
  },

  // Endpoint Create: Tambah data baru
  async create(req, res) {
    try {
      const { nama, deskripsi, tanggal, link } = req.body;
      const id = uuidv4(); // generate id unik
      // Data yang akan disimpan dalam Google Sheets
      const values = [id, nama, deskripsi, tanggal, link];
      await googleSheetService.createData(values);
      res.json({ message: 'Data berhasil ditambahkan', id });
    } catch (error) {
      res.status(500).json({ message: 'Error menambah data', error: error.message });
    }
  },

  // Endpoint Update: Update data berdasarkan id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nama, deskripsi, tanggal, link } = req.body;
      // Baca data saat ini untuk mencari baris yang sesuai id
      const allRows = await googleSheetService.readData();
      const data = parseRows(allRows);
      const target = data.find(item => item.id === id);
      if (!target) return res.status(404).json({ message: 'Data tidak ditemukan' });
      // Perbarui baris pada Google Sheets menggunakan nomor baris yang sudah diketahui
      await googleSheetService.updateData(target.rowNumber, [id, nama, deskripsi, tanggal, link]);
      res.json({ message: 'Data berhasil diperbarui' });
    } catch (error) {
      res.status(500).json({ message: 'Error mengupdate data', error: error.message });
    }
  },

  // Endpoint Delete: Hapus data berdasarkan id
  async delete(req, res) {
    try {
      const { id } = req.params;
      // Cari baris data berdasarkan id
      const allRows = await googleSheetService.readData();
      const data = parseRows(allRows);
      const target = data.find(item => item.id === id);
      if (!target) return res.status(404).json({ message: 'Data tidak ditemukan' });
      await googleSheetService.deleteData(target.rowNumber);
      res.json({ message: 'Data berhasil dihapus' });
    } catch (error) {
      res.status(500).json({ message: 'Error menghapus data', error: error.message });
    }
  }
};
