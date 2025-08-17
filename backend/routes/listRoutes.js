// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const auth = require('../middleware/authMiddleware');

// router.post('/', auth, async (req,res) => {
//   try {
//     const { board_id, title, position } = req.body;
//     const [r] = await pool.query('INSERT INTO lists (board_id, title, position) VALUES (?,?,?)', [board_id, title, position || 0]);
//     const newList = { id: r.insertId, board_id, title, position: position || 0 };
//     // broadcast via socket (socket uses global later)
//     if (global.io) global.io.to(`board_${board_id}`).emit('listCreated', newList);
//     res.json(newList);
//   } catch(err){ console.error(err); res.status(500).json({error:'create list failed'})}
// });

// router.put('/:id', auth, async (req,res) => {
//   try {
//     const id = req.params.id;
//     const { title, position } = req.body;
//     await pool.query('UPDATE lists SET title = ?, position = ? WHERE id = ?', [title, position, id]);
//     const [rows] = await pool.query('SELECT * FROM lists WHERE id = ?', [id]);
//     const updated = rows[0];
//     if (global.io) global.io.to(`board_${updated.board_id}`).emit('listUpdated', updated);
//     res.json(updated);
//   } catch(err){ console.error(err); res.status(500).json({error:'update list failed'})}
// });

// router.delete('/:id', auth, async (req,res) => {
//   try {
//     const id = req.params.id;
//     const [[row]] = await pool.query('SELECT board_id FROM lists WHERE id = ?', [id]);
//     await pool.query('DELETE FROM lists WHERE id = ?', [id]);
//     if (global.io) global.io.to(`board_${row.board_id}`).emit('listDeleted', { id: Number(id) });
//     res.json({ ok: true });
//   } catch(err){ console.error(err); res.status(500).json({error:'delete list failed'})}
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Helper: find boardId from listId
async function getBoardIdByListId(listId) {
  const [[row]] = await pool.query(
    'SELECT board_id FROM lists WHERE id = ?',
    [listId]
  );
  return row?.board_id || null;
}

// Create list (owner/editor)
router.post('/', auth, async (req, res) => {
  try {
    const { board_id, title, position = 0 } = req.body;

    // permission on board
    const [perm] = await pool.query(
      'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
      [req.userId, board_id]
    );
    if (!perm.length || !['owner','editor'].includes(perm[0].role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const [r] = await pool.query(
      'INSERT INTO lists (board_id, title, position) VALUES (?,?,?)',
      [board_id, title, position]
    );
    const newList = { id: r.insertId, board_id, title, position };

    if (global.io) global.io.to(`board_${board_id}`).emit('listCreated', newList);
    res.json(newList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'create list failed' });
  }
});

// Delete list (owner/editor)
router.delete('/:id', auth, async (req, res) => {
  try {
    const listId = Number(req.params.id);
    const boardId = await getBoardIdByListId(listId);
    if (!boardId) return res.status(404).json({ error: 'List not found' });

    const [perm] = await pool.query(
      'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
      [req.userId, boardId]
    );
    if (!perm.length || !['owner','editor'].includes(perm[0].role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await pool.query('DELETE FROM lists WHERE id = ?', [listId]);
    if (global.io) global.io.to(`board_${boardId}`).emit('listDeleted', { id: listId });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'delete list failed' });
  }
});

module.exports = router;
