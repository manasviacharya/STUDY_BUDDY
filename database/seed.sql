
USE study_buddy;

INSERT INTO users (email, password_hash, name) VALUES
('alice@example.com', '$2b$10$rOzJqJqXZ8qZ8qZ8qZ8qZu8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8q', 'Alice Johnson'),
('bob@example.com', '$2b$10$rOzJqJqXZ8qZ8qZ8qZ8qZu8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8q', 'Bob Smith'),
('charlie@example.com', '$2b$10$rOzJqJqXZ8qZ8qZ8qZ8qZu8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8qZ8q', 'Charlie Brown')
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO decks (owner_id, title, description, tags, is_public) VALUES
(1, 'JavaScript Basics', 'Basic JavaScript concepts and syntax', 'javascript,programming,web', TRUE),
(1, 'Spanish Vocabulary', 'Common Spanish words and phrases', 'spanish,language,vocabulary', TRUE),
(2, 'React Hooks', 'React hooks and their usage', 'react,javascript,frontend', TRUE),
(2, 'Private Deck', 'This is a private deck', 'private', FALSE)
ON DUPLICATE KEY UPDATE title=title;

INSERT INTO cards (deck_id, question, answer, hint) VALUES
(1, 'What is a closure in JavaScript?', 'A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.', 'Think about scope and functions'),
(1, 'What is the difference between let and var?', 'let is block-scoped and var is function-scoped. let does not allow redeclaration in the same scope.', 'Consider scope differences'),
(1, 'What is a promise?', 'A promise is an object representing the eventual completion or failure of an asynchronous operation.', 'Think about async operations'),
(2, 'Hello', 'Hola', 'Common greeting'),
(2, 'Thank you', 'Gracias', 'Expression of gratitude'),
(2, 'Good morning', 'Buenos días', 'Morning greeting'),
(3, 'What is useState?', 'useState is a React hook that lets you add state to functional components.', 'Hook for state management'),
(3, 'What is useEffect?', 'useEffect is a React hook that lets you perform side effects in functional components.', 'Hook for side effects')
ON DUPLICATE KEY UPDATE question=question;

