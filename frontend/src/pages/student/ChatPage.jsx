import { useState } from 'react';
import apiFetch from '../../api/client.js';

export default function ChatPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setAnswer('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/chat/ask', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">AI Helper</h1>
          <p className="page-subtitle-luxury">
            Ask for the correct department or process guidance before submitting.
          </p>
        </div>
      </div>

      <section className="card-luxury page-section">
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-group">
            <label className="form-label" htmlFor="chat-question">
              Your Question
            </label>
            <textarea
              id="chat-question"
              rows={4}
              className="input-luxury text-area-luxury"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: My grade was entered incorrectly. Which department should I select?"
              required
            />
          </div>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" disabled={loading || !question.trim()} className="btn-luxury">
            {loading ? 'Thinking...' : 'Ask Assistant'}
          </button>
        </form>
      </section>

      {answer && (
        <section className="card-luxury page-section">
          <div className="card-luxury-content">
            <h2 className="card-title">Assistant Response</h2>
          </div>
          <div className="assistant-answer">{answer}</div>
        </section>
      )}
    </div>
  );
}
