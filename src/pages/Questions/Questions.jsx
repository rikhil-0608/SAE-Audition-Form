import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Send, AlertCircle, ChevronLeft } from 'lucide-react';
import { DOMAIN_QUESTIONS } from '../../data/questions';

import './Questions.css';

export default function Questions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedDomains = location.state?.selectedDomains || [];

  if (selectedDomains.length === 0) {
    return <Navigate to="/domains" />;
  }

  const handleInputChange = (domainId, questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [domainId]: {
        ...(prev[domainId] || {}),
        [questionId]: value
      }
    }));
  };

  const sendToSheets = async (data) => {
  try {
    await fetch("https://script.google.com/macros/s/AKfycbww6Ku32V2SAQwH3KhFLYqi3DxQLPGuXJDDSm0XfHi-Qh7vSzBVetDQnLp2LCwmmxV5fw/exec", {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Sheets error:", err);
  }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      setError("You must be logged in to submit.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = auth.currentUser.uid;
      const userEmail = auth.currentUser.email;

      if (!db) {
        setTimeout(() => navigate('/success'), 1500);
        return;
      }

      const userRef = doc(db, 'users', userId);
      
      // 🔥 SAVE TO FIREBASE
      const promises = selectedDomains.map(async (domainId) => {
        const domainData = answers[domainId] || {};
        return addDoc(collection(db, domainId), {
          userId,
          email: userEmail,
          responses: domainData,
          submittedAt: serverTimestamp()
        });
      });

      await Promise.all([
        ...promises,
        setDoc(userRef, {
          email: userEmail,
          submitted: true,
          domains: selectedDomains,
          submittedAt: serverTimestamp()
        }, { merge: true })
      ]);

      // 🔥 SEND TO GOOGLE SHEETS (NEW PART)
      for (const domainId of selectedDomains) {
        const domainData = answers[domainId] || {};
        const answersStr = Object.values(domainData).join(" | ");

        await sendToSheets({
          domain: domainId,
          name: userDetails?.name || "",
          email: userEmail,
          rollNo: userDetails?.rollNo || "",
          whatsapp: userDetails?.whatsapp || "",
          year: userDetails?.year || "",
          gender: userDetails?.gender || "",
          branch: userDetails?.branch || "",
          allDomains: selectedDomains.join(" | "),
          answers: answersStr
        });
      }

      navigate('/success');

    } catch (err) {
      console.error(err);
      setError("Failed to submit your application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in questions-page">
      <button 
        onClick={() => navigate('/domains')} 
        className="questions-back-btn"
      >
        <ChevronLeft size={20} /> Back to Domains
      </button>

      <div className="questions-content">
        <h2 className="questions-title font-display font-bold">Audition Form</h2>
        <p className="text-text-secondary questions-subtitle">
          Please answer the domain-specific questions below honestly.
        </p>

        {error && (
          <div className="questions-error">
            <AlertCircle size={20} className="text-primary" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {selectedDomains.map((domainId, index) => {
            const domainInfo = DOMAIN_QUESTIONS[domainId];
            if (!domainInfo) return null;

            return (
              <div key={domainId} className="glass-panel questions-panel">
                <div className="questions-panel-header">
                  <div className="questions-number-circle">
                    {index + 1}
                  </div>
                  <h3 className="questions-domain-title font-display font-bold">{domainInfo.title}</h3>
                </div>

                <div className="questions-grid">
                  {domainInfo.questions.map((q) => (
                    <div key={q.id}>
                      <label className="label questions-label">{q.text}</label>
                      {q.type === 'textarea' ? (
                        <textarea
                          required
                          className="input-field questions-textarea"
                          rows="4"
                          placeholder="Your answer..."
                          value={answers[domainId]?.[q.id] || ''}
                          onChange={(e) => handleInputChange(domainId, q.id, e.target.value)}
                        />
                      ) : (
                        <input
                          required
                          type={q.type}
                          className="input-field"
                          placeholder={q.type === 'url' ? 'https://...' : 'Your answer...'}
                          value={answers[domainId]?.[q.id] || ''}
                          onChange={(e) => handleInputChange(domainId, q.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="questions-submit-container">
            <button type="submit" className="btn-primary questions-submit-btn" disabled={loading}>
              <Send size={20} />
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
