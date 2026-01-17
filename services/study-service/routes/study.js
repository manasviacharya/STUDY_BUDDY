const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/sessions', requireAuth, async (req, res) => {
  try {
    const { deckId, mode } = req.body;
    const userId = req.userId;

    if (!deckId || !mode) {
      return res.status(400).json({
        error: {
          message: 'deckId and mode are required'
        }
      });
    }

    if (mode !== 'practice' && mode !== 'quiz') {
      return res.status(400).json({
        error: {
          message: 'mode must be either "practice" or "quiz"'
        }
      });
    }

    const [decks] = await pool.execute(
      'SELECT id FROM decks WHERE id = ?',
      [deckId]
    );

    if (decks.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Deck not found'
        }
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO study_sessions (user_id, deck_id, mode) VALUES (?, ?, ?)',
      [userId, deckId, mode]
    );

    const [sessions] = await pool.execute(
      'SELECT id, user_id, deck_id, mode, started_at, ended_at FROM study_sessions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      data: sessions[0]
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.get('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.userId;

    const [sessions] = await pool.execute(
      'SELECT id, user_id, deck_id, mode, started_at, ended_at FROM study_sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Session not found'
        }
      });
    }

    if (sessions[0].user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied'
        }
      });
    }

    res.json({
      data: sessions[0]
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.post('/sessions/:sessionId/attempts', requireAuth, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const { cardId, is_correct, time_spent_ms } = req.body;
    const userId = req.userId;

    if (cardId === undefined || is_correct === undefined || time_spent_ms === undefined) {
      return res.status(400).json({
        error: {
          message: 'cardId, is_correct, and time_spent_ms are required'
        }
      });
    }

    const [sessions] = await pool.execute(
      'SELECT id, user_id FROM study_sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Session not found'
        }
      });
    }

    if (sessions[0].user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied'
        }
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO study_attempts (session_id, card_id, is_correct, time_spent_ms) VALUES (?, ?, ?, ?)',
      [sessionId, cardId, is_correct, time_spent_ms]
    );

    const [attempts] = await pool.execute(
      'SELECT id, session_id, card_id, is_correct, time_spent_ms, attempted_at FROM study_attempts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      data: attempts[0]
    });
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.post('/sessions/:sessionId/end', requireAuth, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const userId = req.userId;

    const [sessions] = await pool.execute(
      'SELECT id, user_id FROM study_sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Session not found'
        }
      });
    }

    if (sessions[0].user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied'
        }
      });
    }

    await pool.execute(
      'UPDATE study_sessions SET ended_at = NOW() WHERE id = ?',
      [sessionId]
    );

    const [updatedSessions] = await pool.execute(
      'SELECT id, ended_at FROM study_sessions WHERE id = ?',
      [sessionId]
    );

    res.json({
      data: updatedSessions[0]
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.put('/mastery/:cardId', requireAuth, async (req, res) => {
  try {
    const cardId = parseInt(req.params.cardId);
    const { status } = req.body;
    const userId = req.userId;

    if (!status || (status !== 'mastered' && status !== 'review')) {
      return res.status(400).json({
        error: {
          message: 'status must be either "mastered" or "review"'
        }
      });
    }

    const [existing] = await pool.execute(
      'SELECT user_id, card_id, status FROM mastery WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE mastery SET status = ?, last_reviewed_at = NOW() WHERE user_id = ? AND card_id = ?',
        [status, userId, cardId]
      );
    } else {
      await pool.execute(
        'INSERT INTO mastery (user_id, card_id, status, last_reviewed_at) VALUES (?, ?, ?, NOW())',
        [userId, cardId, status]
      );
    }

    const [mastery] = await pool.execute(
      'SELECT user_id, card_id, status, last_reviewed_at FROM mastery WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );

    res.json({
      data: mastery[0]
    });
  } catch (error) {
    console.error('Update mastery error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

router.get('/progress/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { deckId } = req.query;

    if (!deckId) {
      return res.status(400).json({
        error: {
          message: 'deckId query parameter is required'
        }
      });
    }

    const [cards] = await pool.execute(
      'SELECT id FROM cards WHERE deck_id = ?',
      [deckId]
    );

    const cardIds = cards.map(c => c.id);

    if (cardIds.length === 0) {
      return res.json({
        data: {
          accuracyPct: 0,
          attempts: 0,
          masteredCount: 0,
          reviewCount: 0
        }
      });
    }

    const placeholders = cardIds.map(() => '?').join(',');
    const [attempts] = await pool.execute(
      `SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END) as correct_attempts
      FROM study_attempts
      WHERE card_id IN (${placeholders})
      AND session_id IN (
        SELECT id FROM study_sessions WHERE user_id = ?
      )`,
      [...cardIds, userId]
    );

    const totalAttempts = attempts[0].total_attempts || 0;
    const correctAttempts = attempts[0].correct_attempts || 0;
    const accuracyPct = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    const [mastery] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
        SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review_count
      FROM mastery
      WHERE user_id = ? AND card_id IN (${placeholders})`,
      [userId, ...cardIds]
    );

    const masteredCount = mastery[0].mastered_count || 0;
    const reviewCount = mastery[0].review_count || 0;

    res.json({
      data: {
        accuracyPct: Math.round(accuracyPct * 100) / 100,
        attempts: totalAttempts,
        masteredCount,
        reviewCount
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;

