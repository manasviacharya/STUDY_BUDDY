import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deckAPI } from '../services/api';

const Explore = () => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    loadDecks();
  }, [searchQuery, tagFilter]);

  const loadDecks = async () => {
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (tagFilter) params.tag = tagFilter;
      const response = await deckAPI.getPublicDecks(params);
      setDecks(response.data.data);
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Explore Public Decks</h2>

      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        {decks.length === 0 ? (
          <div className="col-12">
            <div className="alert alert-info">No public decks found.</div>
          </div>
        ) : (
          decks.map((deck) => (
            <div key={deck.id} className="col-md-4 mb-4">
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
                  <Link to={`/decks/${deck.id}`} className="btn btn-primary btn-sm">
                    View Deck
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;

