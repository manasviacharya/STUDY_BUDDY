import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deckAPI, studyAPI, sharingAPI } from '../services/api';

const DeckView = ({ user }) => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadDeck();
    loadCards();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      const response = await deckAPI.getDeck(deckId);
      setDeck(response.data.data);
      setIsOwner(response.data.data.owner_id === user?.id);
    } catch (error) {
      console.error('Error loading deck:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      const response = await deckAPI.getCards(deckId);
      setCards(response.data.data);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleDeleteDeck = async () => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      try {
        await deckAPI.deleteDeck(deckId);
        navigate('/');
      } catch (error) {
        alert('Failed to delete deck');
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

  if (!deck) {
    return null;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{deck.title}</h2>
          <p className="text-muted">{deck.description || 'No description'}</p>
          {deck.tags && (
            <div>
              {deck.tags.split(',').map((tag, idx) => (
                <span key={idx} className="badge bg-secondary me-1">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        {isOwner && (
          <button className="btn btn-danger" onClick={handleDeleteDeck}>
            Delete Deck
          </button>
        )}
      </div>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            Cards ({cards.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'study' ? 'active' : ''}`}
            onClick={() => setActiveTab('study')}
          >
            Study
          </button>
        </li>
      </ul>

      {activeTab === 'overview' && (
        <OverviewTab deck={deck} isOwner={isOwner} user={user} />
      )}
      {activeTab === 'cards' && (
        <CardsTab
          deckId={deckId}
          cards={cards}
          loadCards={loadCards}
          isOwner={isOwner}
        />
      )}
      {activeTab === 'study' && (
        <StudyTab deckId={deckId} cards={cards} user={user} />
      )}
    </div>
  );
};

const OverviewTab = ({ deck, isOwner, user }) => {
  const [shares, setShares] = useState([]);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('read');
  const [shareToken, setShareToken] = useState('');

  useEffect(() => {
    if (isOwner) {
      loadShares();
    }
  }, [isOwner]);

  const loadShares = async () => {
    try {
      const response = await sharingAPI.getShares(deck.id);
      setShares(response.data.data);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const handleCreateShare = async () => {
    try {
      const data = { permission: sharePermission };
      if (shareEmail) {
        data.granteeEmail = shareEmail;
      }
      const response = await sharingAPI.createShare(deck.id, data);
      if (response.data.data.share_token) {
        setShareToken(response.data.data.share_token);
      }
      setShareEmail('');
      loadShares();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to create share');
    }
  };

  const handleDeleteShare = async (shareId) => {
    try {
      await sharingAPI.deleteShare(deck.id, shareId);
      loadShares();
    } catch (error) {
      alert('Failed to delete share');
    }
  };

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Deck Information</h5>
          <p><strong>Owner:</strong> {deck.owner_id === user?.id ? 'You' : 'Other user'}</p>
          <p><strong>Public:</strong> {deck.is_public ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(deck.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {isOwner && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Share Deck</h5>
            <div className="mb-3">
              <label className="form-label">Grantee Email (optional)</label>
              <input
                type="email"
                className="form-control"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Leave empty for share link"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Permission</label>
              <select
                className="form-select"
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
              >
                <option value="read">Read Only</option>
                <option value="collab">Collaborate</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleCreateShare}>
              Create Share
            </button>
            {shareToken && (
              <div className="alert alert-info mt-3">
                Share Link: {window.location.origin}/share/{shareToken}
              </div>
            )}
            {shares.length > 0 && (
              <div className="mt-4">
                <h6>Active Shares</h6>
                <ul className="list-group">
                  {shares.map((share) => (
                    <li key={share.id} className="list-group-item d-flex justify-content-between">
                      <div>
                        {share.grantee_user_id ? `User ID: ${share.grantee_user_id}` : 'Token Share'}
                        <span className="badge bg-secondary ms-2">{share.permission}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteShare(share.id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CardsTab = ({ deckId, cards, loadCards, isOwner }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');

  const handleCreateCard = async () => {
    try {
      await deckAPI.createCard(deckId, { question, answer, hint: hint || null });
      setQuestion('');
      setAnswer('');
      setHint('');
      setShowModal(false);
      loadCards();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to create card');
    }
  };

  const handleUpdateCard = async () => {
    try {
      await deckAPI.updateCard(deckId, editingCard.id, { question, answer, hint: hint || null });
      setEditingCard(null);
      setQuestion('');
      setAnswer('');
      setHint('');
      setShowModal(false);
      loadCards();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to update card');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await deckAPI.deleteCard(deckId, cardId);
        loadCards();
      } catch (error) {
        alert('Failed to delete card');
      }
    }
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setQuestion(card.question);
    setAnswer(card.answer);
    setHint(card.hint || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCard(null);
    setQuestion('');
    setAnswer('');
    setHint('');
  };

  return (
    <div>
      {isOwner && (
        <button className="btn btn-primary mb-3" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus"></i> Add Card
        </button>
      )}
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Question</th>
              <th>Answer</th>
              <th>Hint</th>
              {isOwner && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id}>
                <td>{card.question}</td>
                <td>{card.answer}</td>
                <td>{card.hint || '-'}</td>
                {isOwner && (
                  <td>
                    <button
                      className="btn btn-sm btn-primary me-1"
                      onClick={() => openEditModal(card)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCard ? 'Edit Card' : 'Create Card'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Question</label>
                  <textarea
                    className="form-control"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Answer</label>
                  <textarea
                    className="form-control"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Hint (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={editingCard ? handleUpdateCard : handleCreateCard}
                >
                  {editingCard ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudyTab = ({ deckId, cards, user }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('practice');

  const handleStartStudy = async () => {
    try {
      const response = await studyAPI.createSession({ deckId, mode });
      navigate(`/study/${response.data.data.id}`);
    } catch (error) {
      alert('Failed to start study session');
    }
  };

  if (cards.length === 0) {
    return <div className="alert alert-info">No cards in this deck to study.</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Start Study Session</h5>
          <div className="mb-3">
            <label className="form-label">Mode</label>
            <select
              className="form-select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="practice">Practice</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleStartStudy}>
            Start Study Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeckView;

