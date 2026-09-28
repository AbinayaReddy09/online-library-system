const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// MySQL connection
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'library_db',
    waitForConnections: true,
    connectionLimit: 10
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL connected successfully!');
        connection.release();
    })
    .catch(error => {
        console.error('❌ MySQL connection failed:', error.message);
    });

// GET - Fetch all books
app.get('/books', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM books ORDER BY book_id DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// POST - Add a book
app.post('/books', async (req, res) => {
    try {
        const { title, author, year, genre, available } = req.body;

        const [result] = await pool.query(
            `INSERT INTO books
            (title, author, publication_year, genre, available)
            VALUES (?, ?, ?, ?, ?)`,
            [title, author, year || null, genre, available]
        );

        const [rows] = await pool.query(
            'SELECT * FROM books WHERE book_id = ?',
            [result.insertId]
        );

        res.status(201).json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add book' });
    }
});

// PUT - Update a book
app.put('/books/:id', async (req, res) => {
    try {
        const { title, author, year, genre, available } = req.body;
        const { id } = req.params;

        await pool.query(
            `UPDATE books
             SET title = ?,
                 author = ?,
                 publication_year = ?,
                 genre = ?,
                 available = ?
             WHERE book_id = ?`,
            [title, author, year || null, genre, available, id]
        );

        const [rows] = await pool.query(
            'SELECT * FROM books WHERE book_id = ?',
            [id]
        );

        res.json(rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

// DELETE - Delete a book
app.delete('/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            'DELETE FROM books WHERE book_id = ?',
            [id]
        );

        res.json({ message: 'Book deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📚 Library: http://localhost:${PORT}/onlib.htm`);
});