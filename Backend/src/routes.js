const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/posts", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/posts", async (req, res) => {
  try {
    const { content } = req.body;

    const result = await db.query(
      "INSERT INTO posts (content) VALUES ($1) RETURNING *",
      [content]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/posts/:id", async (req, res) => {
  try {
    const { content } = req.body;

    const result = await db.query(
      `UPDATE posts 
       SET content=$1, updated_at=NOW() 
       WHERE id=$2 
       RETURNING *`,
      [content, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/posts/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM posts WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;