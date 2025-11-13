const db = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    const [result] = await db.query(
      'INSERT INTO files (filename, original_name, file_type, file_size, encrypted_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [filename, originalname, mimetype, size, filePath, req.userId]
    );

    res.status(201).json({
      fileId: result.insertId,
      filename,
      originalName: originalname,
      fileType: mimetype,
      fileSize: size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    const filePath = path.resolve(file.encrypted_path);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set proper headers for download
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Length', file.file_size);

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
};

exports.getFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const [files] = await db.query('SELECT * FROM files WHERE id = ?', [fileId]);

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0];
    const filePath = path.resolve(file.encrypted_path);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set proper headers for viewing (not downloading)
    res.setHeader('Content-Type', file.file_type);
    res.setHeader('Content-Length', file.file_size);

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('File view error:', error);
    res.status(500).json({ error: 'File view failed' });
  }
};