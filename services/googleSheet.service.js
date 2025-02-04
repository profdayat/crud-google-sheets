// services/googleSheet.service.js
const { google } = require('googleapis');
const credentials = {
    client_email: process.env.GOOGLE_SHEETS_CREDENTIALS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_CREDENTIALS_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
};

// Ganti dengan ID Spreadsheet milik Anda
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
// Sheet numeric ID (biasanya 0 jika hanya 1 sheet)
const SHEET_ID = 0;

// Inisialisasi autentikasi service account
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Fungsi untuk membaca data (seluruh baris)
async function readData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:E' // Kolom: id, nama, deskripsi, tanggal, link
  });
  return res.data.values || [];
}

// Fungsi untuk menambahkan data
async function createData(values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:E',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] }
  });
}

// Fungsi untuk mengupdate data pada baris tertentu
async function updateData(rowNumber, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet1!A${rowNumber}:E${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [values] }
  });
}

// Fungsi untuk menghapus baris data menggunakan batchUpdate
async function deleteData(rowNumber) {
  const startIndex = rowNumber - 1; // indeks 0-based
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: SHEET_ID,
            dimension: 'ROWS',
            startIndex: startIndex,
            endIndex: startIndex + 1
          }
        }
      }]
    }
  });
}

module.exports = {
  readData,
  createData,
  updateData,
  deleteData
};
