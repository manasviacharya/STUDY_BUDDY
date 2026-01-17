import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deckAPI, studyAPI } from '../services/api';

const Study = ({ user }) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (cards.length > 0 && currentCardIndex < cards.length) {
      setStartTime(Date.now());
      setShowAnswer(false);
    }
  }, [currentCardIndex, cards.length]);

  const loadSession = async () => {
    try {
      // Get session details
      const sessionResponse = await studyAPI.getSession(sessionId);
      const sessionData = sessionResponse.data.data;
      setSession(sessionData);

      // Load cards for the deck
      const cardsResponse = await deckAPI.getCards(sessionData.deck_id);
      let cardsData = cardsResponse.data.data;
      
      // In quiz mode, shuffle cards
      if (sessionData.mode === 'quiz') {
        cardsData = cardsData.sort(() => Math.random() - 0.5);
      }
      
      setCards(cardsData);
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Failed to load study session');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleAnswer = async (isCorrect) => {
    if (!startTime) return;

    const timeSpent = Date.now() - startTime;

    try {
      await studyAPI.createAttempt(sessionId, {
        cardId: cards[currentCardIndex].id,
        is_correct: isCorrect,
        time_spent_ms: timeSpent
      });

      await studyAPI.updateMastery(cards[currentCardIndex].id, {
        status: isCorrect ? 'mastered' : 'review'
      });

      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        // End of session
        await studyAPI.endSession(sessionId);
        alert('Study session completed!');
        if (session && session.deck_id) {
          navigate(`/decks/${session.deck_id}`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error recording attempt:', error);
      alert('Failed to record attempt');
    }
  };

  const handleEndSession = async () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        await studyAPI.endSession(sessionId);
        if (session && session.deck_id) {
          navigate(`/decks/${session.deck_id}`);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info">No cards to study.</div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Study Session</h2>
        <button className="btn btn-secondary" onClick={handleEndSession}>
          End Session
        </button>
      </div>

      <div className="mb-3">
        <div className="progress">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%` }}
          >
            {currentCardIndex + 1} / {cards.length}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Question</h5>
          <p className="card-text fs-5">{currentCard.question}</p>
          {currentCard.hint && !showAnswer && (
            <p className="text-muted">
              <small>Hint: {currentCard.hint}</small>
            </p>
          )}
        </div>
      </div>

      {!showAnswer ? (
        <div className="text-center">
          <button className="btn btn-primary btn-lg" onClick={handleRevealAnswer}>
            Reveal Answer
          </button>
        </div>
      ) : (
        <div>
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Answer</h5>
              <p className="card-text fs-5">{currentCard.answer}</p>
            </div>
          </div>
          <div className="text-center">
            <button
              className="btn btn-success btn-lg me-3"
              onClick={() => handleAnswer(true)}
            >
              <i className="bi bi-check-circle"></i> Correct
            </button>
            <button
              className="btn btn-danger btn-lg"
              onClick={() => handleAnswer(false)}
            >
              <i className="bi bi-x-circle"></i> Incorrect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Study;

