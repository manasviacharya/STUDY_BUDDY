const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

router.post('/decks/:deckId', requireAuth, async (req, res) => {
  try {
    const deckId = parseInt(req.params.deckId);
    const { permission, granteeEmail } = req.body;
    const userId = req.userId;

    if (!permission || (permission !== 'read' && permission !== 'collab')) {
      return res.status(400).json({
        error: {
          message: 'permission must be either "read" or "collab"'
        }
      });
    }

    const [decks] = await pool.execute(
      'SELECT owner_id FROM decks WHERE id = ?',
      [deckId]
    );

    if (decks.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Deck not found'
        }
      });
    }

    if (decks[0].owner_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Only the owner can share a deck'
        }
      });
    }

    let granteeUserId = null;
    let shareToken = null;

    if (granteeEmail) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [granteeEmail]
      );

      if (users.length > 0) {
        granteeUserId = users[0].id;

        const [existingShares] = await pool.execute(
          'SELECT id FROM deck_shares WHERE deck_id = ? AND grantee_user_id = ?',
          [deckId, granteeUserId]
        );

        if (existingShares.length > 0) {
          return res.status(400).json({
            error: {
              message: 'Deck is already shared with this user'
            }
          });
        }
      } else {
        shareToken = generateShareToken();
      }
    } else {
      shareToken = generateShareToken();
    }

    const [result] = await pool.execute(
      'INSERT INTO deck_shares (deck_id, grantee_user_id, permission, share_token) VALUES (?, ?, ?, ?)',
      [deckId, granteeUserId, permission, shareToken]
    );

    const [shares] = await pool.execute(
      'SELECT id, deck_id, grantee_user_id, permission, share_token, created_at FROM deck_shares WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      data: shares[0]
    });
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.get('/decks/:deckId', requireAuth, async (req, res) => {
  try {
    const deckId = parseInt(req.params.deckId);
    const userId = req.userId;

    const [decks] = await pool.execute(
      'SELECT owner_id FROM decks WHERE id = ?',
      [deckId]
    );

    if (decks.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Deck not found'
        }
      });
    }

    const isOwner = decks[0].owner_id === userId;

    const [shares] = await pool.execute(
      'SELECT permission FROM deck_shares WHERE deck_id = ? AND grantee_user_id = ?',
      [deckId, userId]
    );

    const isCollaborator = shares.length > 0 && shares[0].permission === 'collab';

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        error: {
          message: 'Access denied'
        }
      });
    }

    const [allShares] = await pool.execute(
      'SELECT id, deck_id, grantee_user_id, permission, share_token, created_at FROM deck_shares WHERE deck_id = ?',
      [deckId]
    );

    res.json({
      data: allShares
    });
  } catch (error) {
    console.error('List shares error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.delete('/decks/:deckId/:shareId', requireAuth, async (req, res) => {
  try {
    const deckId = parseInt(req.params.deckId);
    const shareId = parseInt(req.params.shareId);
    const userId = req.userId;

    const [decks] = await pool.execute(
      'SELECT owner_id FROM decks WHERE id = ?',
      [deckId]
    );

    if (decks.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Deck not found'
        }
      });
    }

    if (decks[0].owner_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Only the owner can delete shares'
        }
      });
    }

    const [shares] = await pool.execute(
      'SELECT id FROM deck_shares WHERE id = ? AND deck_id = ?',
      [shareId, deckId]
    );

    if (shares.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Share not found'
        }
      });
    }

    await pool.execute(
      'DELETE FROM deck_shares WHERE id = ?',
      [shareId]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.get('/link/:shareToken', requireAuth, async (req, res) => {
  try {
    const shareToken = req.params.shareToken;

    const [shares] = await pool.execute(
      'SELECT deck_id, permission FROM deck_shares WHERE share_token = ?',
      [shareToken]
    );

    if (shares.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Share token not found'
        }
      });
    }

    const share = shares[0];

    const [shareDetails] = await pool.execute(
      'SELECT grantee_user_id FROM deck_shares WHERE share_token = ?',
      [shareToken]
    );

    if (shareDetails[0].grantee_user_id === null) {
      await pool.execute(
        'UPDATE deck_shares SET grantee_user_id = ?, share_token = NULL WHERE share_token = ?',
        [req.userId, shareToken]
      );
    } else if (shareDetails[0].grantee_user_id !== req.userId) {
      return res.status(403).json({
        error: {
          message: 'This share token is already assigned to another user'
        }
      });
    }

    res.json({
      data: {
        deck_id: share.deck_id,
        permission: share.permission
      }
    });
  } catch (error) {
    console.error('Resolve token error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;