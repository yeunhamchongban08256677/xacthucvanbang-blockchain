const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Cấu hình kết nối đến MySQL ---
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234', 
    database: 'certichain_db'
};

// --- API Endpoints ---

// API để lấy danh sách TẤT CẢ các trường (cho trang search.html và addsite.html)
app.get('/api/universities', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT name, walletAddress FROM universities ORDER BY name ASC'
        );
        await connection.end();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API để thêm một trường mới (cho trang addsite)
app.post('/api/universities/add', async (req, res) => {
    const { name, walletAddress } = req.body;
    if (!name || !walletAddress) {
        return res.status(400).json({ error: 'Name and walletAddress are required' });
    }
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'INSERT INTO universities (name, walletAddress) VALUES (?, ?)',
            [name, walletAddress.toLowerCase()]
        );
        await connection.end();
        res.status(201).json({ id: result.insertId, name, walletAddress });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API để lấy thông tin một trường dựa trên địa chỉ ví (cho trang login.html)
app.get('/api/university/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT name FROM universities WHERE walletAddress = ?',
            [walletAddress.toLowerCase()]
        );
        await connection.end();

        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'University not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API để XÓA một trường dựa trên địa chỉ ví (cho trang addsite)
app.delete('/api/universities/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute(
            'DELETE FROM universities WHERE walletAddress = ?',
            [walletAddress.toLowerCase()]
        );
        await connection.end();
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'University deleted successfully' });
        } else {
            res.status(404).json({ error: 'University not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- Khởi động máy chủ ---
const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Backend server is running on http://localhost:${PORT}`);
// });

// run server demo trong mạng nội bộ

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});