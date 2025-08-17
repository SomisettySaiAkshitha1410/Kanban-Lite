// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const auth = require('../middleware/authMiddleware');

// // create board
// router.post('/', auth, async (req,res) => {
//   try {
//     const { name } = req.body;
//     const [r] = await pool.query('INSERT INTO boards (name, created_by) VALUES (?,?)', [name, req.userId]);
//     const boardId = r.insertId;
//     await pool.query('INSERT INTO user_board_permissions (user_id, board_id, role) VALUES (?,?,?)', [req.userId, boardId, 'owner']);
//     res.json({ id: boardId, name });
//   } catch(err){ console.error(err); res.status(500).json({ error:'create board failed' }) }
// });

// // list boards for user
// // router.get('/', auth, async (req,res) => {
// //   try {
// //     const [rows] = await pool.query(
// //       `SELECT b.* FROM boards b JOIN user_board_permissions ub ON ub.board_id = b.id WHERE ub.user_id = ?`, [req.userId]
// //     );
// //     res.json(rows);
// //   } catch(err) { console.error(err); res.status(500).json({ error:'get boards failed' }) }
// // });

// // list boards for user (owned + shared)
// router.get('/', auth, async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `
//       SELECT DISTINCT b.* 
//       FROM boards b
//       LEFT JOIN user_board_permissions ub 
//         ON ub.board_id = b.id
//       WHERE b.created_by = ? OR ub.user_id = ?
//       `,
//       [req.userId, req.userId]
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'get boards failed' });
//   }
// });

// // get board with lists & cards
// router.get('/:boardId', auth, async (req,res) => {
//   try {
//     const boardId = req.params.boardId;
//      // Check if user has permission to this board
//     const [permRows] = await pool.query(
//       'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
//       [req.userId, boardId]
//     );
//     if (permRows.length === 0) {
//       return res.status(403).json({ error: 'Access denied to this board' });
//     }
//     const [[board]] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
//     if (!board) return res.status(404).json({ error: 'Board not found' });
//     const [lists] = await pool.query('SELECT * FROM lists WHERE board_id = ? ORDER BY position', [boardId]);
//     const [cards] = await pool.query('SELECT * FROM cards WHERE list_id IN (SELECT id FROM lists WHERE board_id = ?) ORDER BY position', [boardId]);
//     res.json({ board, lists, cards });
//   } catch(err){ console.error(err); res.status(500).json({error:'get board failed'})}
// });

// // delete board (owner only)
// router.delete('/:boardId', auth, async (req, res) => {
//   try {
//     const boardId = req.params.boardId;

//     // check if the user is owner of the board
//     const [permRows] = await pool.query(
//       'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
//       [req.userId, boardId]
//     );

//     if (permRows.length === 0 || permRows[0].role !== 'owner') {
//       return res.status(403).json({ error: 'Only the board owner can delete this board' });
//     }

//     // delete cards -> lists -> board
//     await pool.query(
//       'DELETE FROM cards WHERE list_id IN (SELECT id FROM lists WHERE board_id = ?)',
//       [boardId]
//     );
//     await pool.query('DELETE FROM lists WHERE board_id = ?', [boardId]);

//     // delete user permissions for this board
//     await pool.query('DELETE FROM user_board_permissions WHERE board_id = ?', [boardId]);

//     // finally delete the board
//     await pool.query('DELETE FROM boards WHERE id = ?', [boardId]);

//     res.sendStatus(204);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'delete board failed' });
//   }
// });


// router.post('/boards/:boardId/share', auth, async (req, res) => {
//   const { userIdToShare, role } = req.body;
//   const boardId = req.params.boardId;

//   // Check if current user is owner
//   const [permRows] = await pool.query(
//     'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
//     [req.userId, boardId]
//   );

//   if (permRows.length === 0 || permRows[0].role !== 'owner') {
//     return res.status(403).json({ error: 'Only owner can share this board' });
//   }

//   // Add or update permissions for the new user
//   await pool.query(
//     `INSERT INTO user_board_permissions (user_id, board_id, role)
//      VALUES (?, ?, ?)
//      ON DUPLICATE KEY UPDATE role = VALUES(role)`,
//     [userIdToShare, boardId, role]
//   );

//   res.json({ message: 'Board shared successfully' });
// });


// module.exports = router;


// const express = require('express');
// const router = express.Router();
// const pool = require('../config/db');
// const auth = require('../middleware/authMiddleware');
// const checkBoardPermission = require('../middleware/checkBoardPermission');

// // Create board (creator becomes owner)
// router.post('/', auth, async (req, res) => {
//   try {
//     const { name } = req.body;
//     const [r] = await pool.query(
//       'INSERT INTO boards (name, created_by) VALUES (?,?)',
//       [name, req.userId]
//     );
//     const boardId = r.insertId;

//     await pool.query(
//       'INSERT INTO user_board_permissions (user_id, board_id, role) VALUES (?,?,?)',
//       [req.userId, boardId, 'owner']
//     );

//     res.json({ id: boardId, name });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'create board failed' });
//   }
// });

// // List boards for user (owned + shared)
// router.get('/', auth, async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `
//       SELECT DISTINCT b.*
//       FROM boards b
//       LEFT JOIN user_board_permissions ub ON ub.board_id = b.id
//       WHERE b.created_by = ? OR ub.user_id = ?
//       ORDER BY b.id DESC
//       `,
//       [req.userId, req.userId]
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'get boards failed' });
//   }
// });

// // Get a board with lists & cards (any role can view)
// router.get('/:boardId', auth, checkBoardPermission(['owner','editor','viewer']), async (req, res) => {
//   try {
//     const boardId = req.params.boardId;

//     const [[board]] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
//     if (!board) return res.status(404).json({ error: 'Board not found' });

//     const [lists] = await pool.query(
//       'SELECT * FROM lists WHERE board_id = ? ORDER BY position',
//       [boardId]
//     );
//     const [cards] = await pool.query(
//       'SELECT * FROM cards WHERE list_id IN (SELECT id FROM lists WHERE board_id = ?) ORDER BY position',
//       [boardId]
//     );

//     res.json({ board, lists, cards });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'get board failed' });
//   }
// });

// // Share board: owner can add/update a member’s role
// router.post('/:boardId/share', auth, checkBoardPermission(['owner']), async (req, res) => {
//   try {
//     const { userIdToShare, role } = req.body; // 'editor' or 'viewer'
//     const boardId = req.params.boardId;

//     if (!['editor','viewer'].includes(role)) {
//       return res.status(400).json({ error: 'Invalid role' });
//     }

//     await pool.query(
//       `INSERT INTO user_board_permissions (user_id, board_id, role)
//        VALUES (?, ?, ?)
//        ON DUPLICATE KEY UPDATE role = VALUES(role)`,
//       [userIdToShare, boardId, role]
//     );

//     res.json({ message: 'Board shared successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'share failed' });
//   }
// });

// // List members & roles on a board (owner/editor can view)
// router.get('/:boardId/members', auth, checkBoardPermission(['owner','editor']), async (req, res) => {
//   try {
//     const boardId = req.params.boardId;
//     const [rows] = await pool.query(
//       `SELECT u.id, u.username, ub.role
//        FROM user_board_permissions ub
//        JOIN users u ON u.id = ub.user_id
//        WHERE ub.board_id = ?`,
//       [boardId]
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'list members failed' });
//   }
// });

// // Delete board (owner only) – cascades if FKs are set with ON DELETE CASCADE
// router.delete('/:boardId', auth, checkBoardPermission(['owner']), async (req, res) => {
//   try {
//     const boardId = req.params.boardId;
//     await pool.query('DELETE FROM boards WHERE id = ?', [boardId]);
//     res.json({ ok: true });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'delete board failed' });
//   }
// });

// router.get('/:boardId', auth, async (req, res) => {
//   try {
//     const boardId = Number(req.params.boardId);
//     if (!boardId) return res.status(400).json({ error: 'Invalid boardId' });

//     // Load the board
//     const [[board]] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);
//     if (!board) return res.status(404).json({ error: 'Board not found' });

//     // Determine the user's role on this board
//     let role;
//     const [permRows] = await pool.query(
//       'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
//       [req.userId, boardId]
//     );

//     if (permRows.length) {
//       role = String(permRows[0].role || '').toLowerCase();
//     } else if (board.created_by === req.userId) {
//       // Fallback safety: treat creator as owner and repair row if missing
//       role = 'owner';
//       await pool.query(
//         `INSERT INTO user_board_permissions (user_id, board_id, role)
//          VALUES (?, ?, 'owner')
//          ON DUPLICATE KEY UPDATE role = 'owner'`,
//         [req.userId, boardId]
//       );
//     } else {
//       return res.status(403).json({ error: 'Access denied to this board' });
//     }

//     // Fetch lists
//     const [lists] = await pool.query(
//       'SELECT * FROM lists WHERE board_id = ? ORDER BY position, id',
//       [boardId]
//     );

//     // Fetch cards (only if there are lists to avoid IN () errors)
//     let cards = [];
//     if (lists.length) {
//       const listIds = lists.map(l => l.id);
//       const placeholders = listIds.map(() => '?').join(',');
//       const [cardRows] = await pool.query(
//         `SELECT * FROM cards WHERE list_id IN (${placeholders}) ORDER BY position, id`,
//         listIds
//       );
//       cards = cardRows;
//     }

//     // Return role both top-level and embedded in board for the frontend
//     res.json({
//       board: { ...board, role },
//       role,
//       lists,
//       cards
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'get board failed' });
//   }
// });

// module.exports = router;

// routes/boardRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const checkBoardPermission = require('../middleware/checkBoardPermission');

/**
 * Utility to send consistent errors
 */
const sendError = (res, msg, status = 500) => {
  res.status(status).json({ error: msg });
};

/**
 * Create board (creator becomes owner)
 */
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return sendError(res, 'Board name required', 400);

    const [result] = await pool.query(
      'INSERT INTO boards (name, created_by) VALUES (?, ?)',
      [name.trim(), req.userId]
    );

    const boardId = result.insertId;

    await pool.query(
      `INSERT INTO user_board_permissions (user_id, board_id, role)
       VALUES (?, ?, 'owner')`,
      [req.userId, boardId]
    );

    res.json({ id: boardId, name });
  } catch (err) {
    console.error(err);
    sendError(res, 'Create board failed');
  }
});

/**
 * List boards for current user
 * Returns owned + shared
 */
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT DISTINCT b.*
      FROM boards b
      LEFT JOIN user_board_permissions ub 
        ON ub.board_id = b.id
      WHERE b.created_by = ? OR ub.user_id = ?
      ORDER BY b.id DESC
      `,
      [req.userId, req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    sendError(res, 'Get boards failed');
  }
});

/**
 * Get a board with lists & cards
 * Any role can view
 * Also returns user's role for this board
 */
router.get('/:boardId', auth, async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);
    if (!boardId) return sendError(res, 'Invalid boardId', 400);

    // Load board
    const [[board]] = await pool.query(
      'SELECT * FROM boards WHERE id = ?',
      [boardId]
    );
    if (!board) return sendError(res, 'Board not found', 404);

    // Determine the user's role
    let role;
    const [permRows] = await pool.query(
      'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
      [req.userId, boardId]
    );

    if (permRows.length) {
      role = String(permRows[0].role || '').toLowerCase();
    } else if (board.created_by === req.userId) {
      // Fallback: treat creator as owner and fix DB if missing
      role = 'owner';
      await pool.query(
        `INSERT INTO user_board_permissions (user_id, board_id, role)
         VALUES (?, ?, 'owner')
         ON DUPLICATE KEY UPDATE role = 'owner'`,
        [req.userId, boardId]
      );
    } else {
      return sendError(res, 'Access denied to this board', 403);
    }

    // Fetch lists
    const [lists] = await pool.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position, id',
      [boardId]
    );

    // Fetch cards only if lists exist
    let cards = [];
    if (lists.length) {
      const listIds = lists.map(l => l.id);
      const placeholders = listIds.map(() => '?').join(',');
      const [cardRows] = await pool.query(
        `SELECT * FROM cards 
         WHERE list_id IN (${placeholders}) 
         ORDER BY position, id`,
        listIds
      );
      cards = cardRows;
    }

    res.json({
      board: { ...board, role },
      role, // top-level for direct use in frontend
      lists,
      cards
    });
  } catch (err) {
    console.error(err);
    sendError(res, 'Get board failed');
  }
});

/**
 * Share board - Owner only
 * Add/update user's role on board
 */
router.post('/:boardId/share', auth, checkBoardPermission(['owner']), async (req, res) => {
  try {
    const { userIdToShare, role } = req.body;

    if (!userIdToShare || !['editor', 'viewer'].includes(role)) {
      return sendError(res, 'Invalid user or role', 400);
    }

    const boardId = Number(req.params.boardId);

    await pool.query(
      `INSERT INTO user_board_permissions (user_id, board_id, role)
         VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [userIdToShare, boardId, role]
    );

    res.json({ message: 'Board shared successfully' });
  } catch (err) {
    console.error(err);
    sendError(res, 'Share board failed');
  }
});

/**
 * List members & roles on a board
 * Owner/editor can view
 */
router.get('/:boardId/members', auth, checkBoardPermission(['owner', 'editor']), async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, ub.role
         FROM user_board_permissions ub
         JOIN users u ON u.id = ub.user_id
        WHERE ub.board_id = ?`,
      [boardId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    sendError(res, 'Get members failed');
  }
});

/**
 * Delete board - Owner only
 * Relies on ON DELETE CASCADE in schema
 */
router.delete('/:boardId', auth, checkBoardPermission(['owner']), async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);
    await pool.query('DELETE FROM boards WHERE id = ?', [boardId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    sendError(res, 'Delete board failed');
  }
});

// routes/boardRoutes.js

router.delete('/:boardId/members/:userId', auth, checkBoardPermission(['owner']), async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);
    const userId = Number(req.params.userId);

    // Prevent owner from removing themselves
    const [[board]] = await pool.query('SELECT created_by FROM boards WHERE id = ?', [boardId]);
    if (board.created_by === userId) {
      return res.status(400).json({ error: "Owner cannot remove themselves." });
    }

    await pool.query(
      'DELETE FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
      [userId, boardId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Remove member failed' });
  }
});

// routes/boardRoutes.js
router.get('/:boardId/members', auth, checkBoardPermission(['owner', 'editor']), async (req, res) => {
  try {
    const boardId = Number(req.params.boardId);
    const [rows] = await pool.query(
      `SELECT u.id, u.username, ub.role
       FROM user_board_permissions ub
       JOIN users u ON u.id = ub.user_id
       WHERE ub.board_id = ? AND u.id <> ?`, // exclude yourself
      [boardId, req.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list board members' });
  }
});



// router.post('/users/batch', async (req, res) => {
//   const ids = req.body.ids;
//   if (!Array.isArray(ids) || ids.length === 0) return res.json([]);
//   const validIds = ids.filter(id => id !== null); // Filter out nulls
//   if (validIds.length === 0) return res.json([]);
//   const placeholders = validIds.map(() => '?').join(',');
//   const [users] = await pool.query(
//     `SELECT id, username FROM users WHERE id IN (${placeholders})`,
//     validIds
//   );
 // res.json(users);
//});



module.exports = router;
