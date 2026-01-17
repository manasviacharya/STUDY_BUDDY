import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI, studyAPI } from '../services/api';

const Dashboard = ({ user }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [newDeckTags, setNewDeckTags] = useState('');
  const [newDeckPublic, setNewDeckPublic] = useState(false);

  useEffect(() => {
    loadDecks();
  }, [searchQuery]);

  const loadDecks = async () => {
    try {
      const params = searchQuery ? { q: searchQuery } : {};
      const response = await deckAPI.getMyDecks(params);
      setDecks(response.data.data);
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (deckId) => {
    try {
      const response = await studyAPI.getProgress(deckId);
      return response.data.data;
    } catch (error) {
      return null;
    }
  };

  const handleCreateDeck = async () => {
    try {
      await deckAPI.createDeck({
        title: newDeckTitle,
        description: newDeckDescription || null,
        tags: newDeckTags || null,
        is_public: newDeckPublic
      });
      setNewDeckTitle('');
      setNewDeckDescription('');
      setNewDeckTags('');
      setNewDeckPublic(false);
      setShowCreateModal(false);
      loadDecks();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to create deck');
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Decks</h2>
        <div>
          <button className="btn btn-primary me-2" onClick={() => setShowCreateModal(true)}>
            <i className="bi bi-plus"></i> Create Deck
          </button>
          <Link to="/explore" className="btn btn-outline-primary">
            <i className="bi bi-search"></i> Explore Public Decks
          </Link>
        </div>
      </div>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search decks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="row">
        {decks.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">
              No decks found. <Link to="/explore">Explore public decks</Link> or create a new deck from a deck page.
            </div>
          </div>
        ) : (
          decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Deck</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={newDeckDescription}
                    onChange={(e) => setNewDeckDescription(e.target.value)}
                    rows="3"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newDeckTags}
                    onChange={(e) => setNewDeckTags(e.target.value)}
                    placeholder="javascript, programming, web"
                  />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newDeckPublic}
                      onChange={(e) => setNewDeckPublic(e.target.checked)}
                      id="publicDeck"
                    />
                    <label className="form-check-label" htmlFor="publicDeck">
                      Make this deck public
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreateDeck}>
                  Create Deck
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DeckCard = ({ deck }) => {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    loadProgress();
  }, [deck.id]);

  const loadProgress = async () => {
    try {
      const response = await studyAPI.getProgress(deck.id);
      setProgress(response.data.data);
    } catch (error) {
      // Progress might not be available, ignore errors
    }
  };

  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100">
        <div className="card-body">
          <h5 className="card-title">{deck.title}</h5>
          <p className="card-text text-muted">{deck.description || 'No description'}</p>
          {deck.tags && (
            <div className="mb-2">
              {deck.tags.split(',').map((tag, idx) => (
                <span key={idx} className="badge bg-secondary me-1">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
          {progress && (
            <div className="mb-2">
              <small className="text-muted">
                Accuracy: {progress.accuracyPct.toFixed(1)}% | 
                Mastered: {progress.masteredCount} | 
                Attempts: {progress.attempts}
              </small>
            </div>
          )}
          <Link to={`/decks/${deck.id}`} className="btn btn-primary btn-sm">
            View Deck
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

