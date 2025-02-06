require("dotenv").config();
const path = require('path');
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const serverless = require("serverless-http");

const app = express();
const router = express.Router(); // Gunakan router untuk Netlify Functions

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ==========================================================
// Konfigurasi JWT
// ==========================================================
const jwtConfig = {
  secret: process.env.JWT_SECRET || "secret-default",
};

// Middleware untuk autentikasi JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Token tidak ditemukan" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, jwtConfig.secret, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token tidak valid" });
    req.user = decoded;
    next();
  });
}

// ==========================================================
// Konfigurasi Google Sheets
// ==========================================================
const googleCredentials = {
  client_email: process.env.GOOGLE_SHEETS_CREDENTIALS_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_SHEETS_CREDENTIALS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_ID = 0;

const auth = new google.auth.JWT(
  googleCredentials.client_email,
  null,
  googleCredentials.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

// Fungsi untuk membaca data dari Google Sheets
async function readData() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A:E",
  });
  return res.data.values || [];
}

// Fungsi untuk menambahkan data ke Google Sheets
async function createData(values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A:E",
    valueInputOption: "USER_ENTERED",
    resource: { values: [values] },
  });
}

// Fungsi untuk mengupdate data di baris tertentu
async function updateData(rowNumber, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Sheet1!A${rowNumber}:E${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    resource: { values: [values] },
  });
}

// Fungsi untuk menghapus data dari Google Sheets
async function deleteData(rowNumber) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: SHEET_ID,
              dimension: "ROWS",
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
}

// ==========================================================
// Helper Functions
// ==========================================================
function parseRows(rows) {
  if (!rows || rows.length < 2) return [];
  return rows.slice(1).map((row, i) => ({
    id: row[0],
    nama: row[1],
    deskripsi: row[2],
    tanggal: row[3],
    link: row[4],
    rowNumber: i + 2, // Karena header ada di baris pertama
  }));
}




// ==========================================================
// API Routes
// ==========================================================

// READ: Ambil semua data atau filter berdasarkan tanggal
router.get("/credit/read", async (req, res) => {
  try {
    const allRows = await readData();
    const data = parseRows(allRows);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error membaca data", error: error.message });
  }
});

// CREATE: Tambah data baru
router.post("/credit/create", authMiddleware, async (req, res) => {
  try {
    const { nama, deskripsi, tanggal, link } = req.body;
    const id = uuidv4();
    await createData([id, nama, deskripsi, tanggal, link]);
    res.json({ message: "Data berhasil ditambahkan", id });
  } catch (error) {
    res.status(500).json({ message: "Error menambah data", error: error.message });
  }
});

// UPDATE: Perbarui data berdasarkan id
router.put("/credit/update/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, tanggal, link } = req.body;
    const allRows = await readData();
    const data = parseRows(allRows);
    const target = data.find(item => item.id === id);

    if (!target) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    await updateData(target.rowNumber, [id, nama, deskripsi, tanggal, link]);
    res.json({ message: "Data berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Error mengupdate data", error: error.message });
  }
});

// DELETE: Hapus data berdasarkan id
router.delete("/credit/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const allRows = await readData();
    const data = parseRows(allRows);
    const target = data.find(item => item.id === id);

    if (!target) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    await deleteData(target.rowNumber);
    res.json({ message: "Data berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Error menghapus data", error: error.message });
  }
});

// LOGIN: Autentikasi pengguna dan buat token JWT
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.LOGIN_USERNAME && password === process.env.LOGIN_PASSWORD) {
    const token = jwt.sign({ username }, jwtConfig.secret, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Username atau password salah" });
  }
});

// ==========================================================
// Integrasi Router ke Express App
// ==========================================================
app.use("/.netlify/functions/api", router);

// ==========================================================
// Bungkus Express App sebagai Netlify Function
// ==========================================================
module.exports.handler = serverless(app);
