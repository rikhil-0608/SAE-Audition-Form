import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { User, AlertCircle, ArrowRight } from 'lucide-react';

import './UserDetails.css';

export default function UserDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    whatsapp: '',
    year: '',
    gender: '',
    branch: ''
  });

  useEffect(() => {
    const checkSubmission = async () => {
      if (auth?.currentUser && db) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().submitted) {
            navigate('/success');
          } else if (userSnap.exists() && userSnap.data().name) {
            setFormData(prev => ({ ...prev, ...userSnap.data() }));
          }
        } catch (e) {
          console.error("Error checking submission status", e);
        }
      }
    };
    checkSubmission();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      setError("You must be logged in to submit details.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (db) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, {
          email: auth.currentUser.email,
          ...formData,
          updatedAt: new Date()
        }, { merge: true });
      } else {
        console.warn("No DB config, bypassing db save...");
      }
      navigate('/domains', {
        state: { userDetails: formData }
      });
    } catch (err) {
      console.error(err);
      setError("Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in user-details-page">
      <div className="user-details-content">
        <h2 className="user-details-title font-display font-bold">Applicant Details</h2>
        <p className="text-text-secondary user-details-subtitle">
          Please fill out your core details before choosing your domains.
        </p>

        {error && (
          <div className="user-details-error">
            <AlertCircle size={20} className="text-primary" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel user-details-form">
          <div className="user-details-grid">
            <div>
              <label className="label">Full Name</label>
              <input type="text" name="name" required className="input-field" placeholder="Enter your Name" value={formData.name} onChange={handleInputChange} />
            </div>

            <div>
              <label className="label">Roll Number</label>
              <input type="text" name="rollNo" required className="input-field" placeholder="Enter your Roll Number" value={formData.rollNo} onChange={handleInputChange} />
            </div>

            <div>
              <label className="label">WhatsApp Number</label>
              <input type="tel" name="whatsapp" required className="input-field" placeholder="Enter your WhatsApp Number" value={formData.whatsapp} onChange={handleInputChange} />
            </div>

            <div className="user-details-grid-cols-2">
              <div>
                <label className="label">Year</label>
                <select name="year" required className="input-field user-details-select" value={formData.year} onChange={handleInputChange}>
                  <option value="" disabled>Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                </select>
              </div>
              <div>
                <label className="label">Gender</label>
                <select name="gender" required className="input-field user-details-select" value={formData.gender} onChange={handleInputChange}>
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Branch</label>
              <select name="branch" required className="input-field user-details-select" value={formData.branch} onChange={handleInputChange}>
                <option value="" disabled>Select Branch</option>
                <option value="BT">BT</option>
                <option value="CSE">CSE</option>
                <option value="CE">CE</option>
                <option value="CHE">CHE</option>
                <option value="ECE">ECE</option>
                <option value="EE">EE</option>
                <option value="MME">MME</option>
                <option value="ME">ME</option>
                <option value="MnC">MnC</option>
                <option value="OTHERS">OTHERS</option>
              </select>
            </div>
          </div>

          <div className="user-details-submit-container">
            <button type="submit" className="btn-primary user-details-submit-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Continue'} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
