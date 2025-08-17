// const pool = require('../config/db');

// const checkBoardPermission = (rolesAllowed = ['owner','editor','viewer']) => {
//   return async (req, res, next) => {
//     try {
//       const boardId = Number(req.params.boardId);
//       if (!boardId) return res.status(400).json({ error: 'Missing boardId' });

//       const [rows] = await pool.query(
//         'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
//         [req.userId, boardId]
//       );

//       if (rows.length === 0 || !rolesAllowed.includes(rows[0].role)) {
//         return res.status(403).json({ error: 'Permission denied' });
//       }
//       req.userRoleOnBoard = rows[0].role;
//       next();
//     } catch (e) {
//       console.error(e);
//       res.status(500).json({ error: 'Permission check failed' });
//     }
//   };
// };

// module.exports = checkBoardPermission;


// middleware/checkBoardPermission.js
const pool = require('../config/db');

const checkBoardPermission = (rolesAllowed = ['owner', 'editor', 'viewer']) => {
  return async (req, res, next) => {
    try {
      // Allow flexible retrieval of boardId from params or body
      const boardId = Number(
        req.params.boardId || req.body.board_id || req.query.boardId
      );

      if (!boardId) {
        return res.status(400).json({ error: 'Missing or invalid boardId' });
      }

      // First check if the board exists
      const [[board]] = await pool.query(
        'SELECT * FROM boards WHERE id = ?',
        [boardId]
      );
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      // Now check permission table
      const [rows] = await pool.query(
        'SELECT role FROM user_board_permissions WHERE user_id = ? AND board_id = ?',
        [req.userId, boardId]
      );

      let role;
      if (rows.length) {
        role = String(rows[0].role || '').toLowerCase();
      } else if (board.created_by === req.userId) {
        // Creator but no row — treat as owner & repair DB
        role = 'owner';
        await pool.query(
          `INSERT INTO user_board_permissions (user_id, board_id, role)
           VALUES (?, ?, 'owner')
           ON DUPLICATE KEY UPDATE role = 'owner'`,
          [req.userId, boardId]
        );
      } else {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Role check
      if (!rolesAllowed.includes(role)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      // Attach to request for later use
      req.boardRole = role;
      req.boardId = boardId;
      next();
    } catch (err) {
      console.error('checkBoardPermission error', err);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = checkBoardPermission;
