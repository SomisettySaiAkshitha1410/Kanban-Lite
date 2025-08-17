// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const auth = require('../middleware/authMiddleware');

// router.post('/', auth, async (req,res) => {
//   try {
//     const { list_id, title, description, position } = req.body;
//     const [r] = await pool.query('INSERT INTO cards (list_id, title, description, position, created_by) VALUES (?,?,?,?,?)', [list_id, title, description || '', position || 0, req.userId]);
//     const [cardRows] = await pool.query('SELECT * FROM cards WHERE id = ?', [r.insertId]);
//     const newCard = cardRows[0];
//     const [[listRow]] = await pool.query('SELECT board_id FROM lists WHERE id = ?', [list_id]);
//     if (global.io) global.io.to(`board_${listRow.board_id}`).emit('cardCreated', newCard);
//     res.json(newCard);
//   } catch(err){ console.error(err); res.status(500).json({error:'create card failed'})}
// });

// // router.put('/:id', auth, async (req,res) => {
// //   try {
// //     const id = req.params.id;
// //     const { list_id, position, title, description } = req.body;
// //     await pool.query('UPDATE cards SET list_id = ?, position = ?, title = ?, description = ? WHERE id = ?', [list_id, position || 0, title || null, description || null, id]);
// //     const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
// //     const updated = rows[0];
// //     const [[listRow]] = await pool.query('SELECT board_id FROM lists WHERE id = ?', [updated.list_id]);
// //     if (global.io) global.io.to(`board_${listRow.board_id}`).emit('cardUpdated', updated);
// //     res.json(updated);
// //   } catch(err){ console.error(err); res.status(500).json({error:'update card failed'})}
// // });

// router.put('/:id', auth, async (req,res) => {
//   try {
//     const id = req.params.id;
//     const { list_id, position, title, description } = req.body;

//     // Get current card so we can preserve fields
//     const [[existing]] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);

//     await pool.query(
//       'UPDATE cards SET list_id = ?, position = ?, title = ?, description = ? WHERE id = ?',
//       [
//         list_id ?? existing.list_id,
//         position ?? existing.position,
//         title ?? existing.title,
//         description ?? existing.description,
//         id
//       ]
//     );

//     const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
//     const updated = rows[0];

//     const [[listRow]] = await pool.query('SELECT board_id FROM lists WHERE id = ?', [updated.list_id]);
//     if (global.io) global.io.to(`board_${listRow.board_id}`).emit('cardUpdated', updated);
//     res.json(updated);
//   } catch(err){ 
//     console.error(err); 
//     res.status(500).json({error:'update card failed'}) 
//   }
// });

// router.delete('/:id', auth, async (req,res) => {
//   try {
//     const id = req.params.id;
//     const [[cardRow]] = await pool.query('SELECT c.*, l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [id]);
//     await pool.query('DELETE FROM cards WHERE id = ?', [id]);
//     if (global.io) global.io.to(`board_${cardRow.board_id}`).emit('cardDeleted', { id: Number(id) });
//     res.json({ ok: true });
//   } catch(err){ console.error(err); res.status(500).json({error:'delete card failed'})}
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Helper to check board access
async function checkBoardPermission(userId, boardId, requiredRoles = []) {
  const [permRows] = await pool.query(
    'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
    [userId, boardId]
  );
  if (permRows.length === 0) return false;
  if (requiredRoles.length > 0 && !requiredRoles.includes(permRows[0].role)) {
    return false;
  }
  return true;
}

// CREATE card
router.post('/', auth, async (req, res) => {
  try {
    const { list_id, title, description, position } = req.body;

    // Get boardId for permission check
    const [[listRow]] = await pool.query('SELECT board_id FROM lists WHERE id = ?', [list_id]);
    if (!listRow) return res.status(404).json({ error: 'List not found' });

    const hasPermission = await checkBoardPermission(req.userId, listRow.board_id, ['owner', 'editor']);
    if (!hasPermission) return res.status(403).json({ error: 'No permission to add cards' });

    const [r] = await pool.query(
      'INSERT INTO cards (list_id, title, description, position, created_by) VALUES (?,?,?,?,?)',
      [list_id, title, description || '', position || 0, req.userId]
    );

    const [cardRows] = await pool.query('SELECT * FROM cards WHERE id = ?', [r.insertId]);
    const newCard = cardRows[0];

    if (global.io) global.io.to(`board_${listRow.board_id}`).emit('cardCreated', newCard);
    res.json(newCard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'create card failed' });
  }
});

// UPDATE card
router.put('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;

    const [[existing]] = await pool.query('SELECT c.*, l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    const hasPermission = await checkBoardPermission(req.userId, existing.board_id, ['owner', 'editor']);
    if (!hasPermission) return res.status(403).json({ error: 'No permission to edit cards' });

    const { list_id, position, title, description } = req.body;
    await pool.query(
      'UPDATE cards SET list_id = ?, position = ?, title = ?, description = ? WHERE id = ?',
      [
        list_id ?? existing.list_id,
        position ?? existing.position,
        title ?? existing.title,
        description ?? existing.description,
        id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM cards WHERE id = ?', [id]);
    const updated = rows[0];

    if (global.io) global.io.to(`board_${existing.board_id}`).emit('cardUpdated', updated);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'update card failed' });
  }
});

// DELETE card
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;

    const [[cardRow]] = await pool.query('SELECT c.*, l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?', [id]);
    if (!cardRow) return res.status(404).json({ error: 'Card not found' });

    const hasPermission = await checkBoardPermission(req.userId, cardRow.board_id, ['owner', 'editor']);
    if (!hasPermission) return res.status(403).json({ error: 'No permission to delete cards' });

    await pool.query('DELETE FROM cards WHERE id = ?', [id]);

    if (global.io) global.io.to(`board_${cardRow.board_id}`).emit('cardDeleted', { id: Number(id) });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'delete card failed' });
  }
});

module.exports = router;
