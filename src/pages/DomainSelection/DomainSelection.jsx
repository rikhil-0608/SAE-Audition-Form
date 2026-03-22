import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Monitor, PenTool, Calendar, Settings, Link, ArrowRight, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import './DomainSelection.css';

const availableDomains = [
  { id: 'web_development', title: 'Web Development', desc: 'Build the digital interface of tomorrow.', icon: Monitor },
  { id: 'graphic_designing', title: 'Graphic Design & Video Editing', desc: 'Bring ideas to life with visual storytelling.', icon: PenTool },
  { id: 'event_management', title: 'Event Management', desc: 'Orchestrate chaos into unforgettable experiences.', icon: Calendar },
  { id: 'automobile', title: 'Automobile', desc: 'Engineer and build machines that move us.', icon: Settings },
  { id: 'robotics', title: 'Robotics / ML', desc: 'Automate and train the intelligent future.', icon: Link },
];

export default function DomainSelection() {
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSubmission = async () => {
      if (auth?.currentUser && db) {
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().submitted) {
            navigate('/success');
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkSubmission();
  }, [navigate]);

  const handleToggle = (id) => {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
    setError('');
  };

  const handleNext = () => {
    if (selectedDomains.length === 0) {
      setError('Please select at least one domain to continue.');
      return;
    }

    navigate('/questions', {
      state: {
        selectedDomains,
        userDetails: location.state?.userDetails
      }
    });
  };

  return (
    <div className="container animate-fade-in domain-page">
      <div className="domain-content">
        <h2 className="domain-title font-display font-bold">Choose Your Path</h2>
        <p className="text-text-secondary domain-subtitle">
          Select the domains you are interested in auditioning for. You can choose multiple.
        </p>

        {error && (
          <div className="domain-error">
            <AlertCircle size={20} className="text-primary" />
            <span>{error}</span>
          </div>
        )}

        <div className="domain-grid-main">
          <div className="domain-grid-top">
            {availableDomains.slice(0, 2).map(domain => <DomainCard key={domain.id} domain={domain} isSelected={selectedDomains.includes(domain.id)} onToggle={handleToggle} />)}
          </div>
          <div className="domain-grid-bottom">
            {availableDomains.slice(2).map(domain => <DomainCard key={domain.id} domain={domain} isSelected={selectedDomains.includes(domain.id)} onToggle={handleToggle} />)}
          </div>
        </div>

        <div className="domain-next-container">
          <button className="btn-primary domain-next-btn" onClick={handleNext}>
            Configure Audition <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DomainCard({ domain, isSelected, onToggle }) {
  const Icon = domain.icon;
  return (
    <label className="domain-card">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(domain.id)}
      />
      <div className="card-content">
        <div>
          <div className={`domain-card-icon-box ${isSelected ? 'selected' : 'unselected'}`}>
            <Icon size={28} style={{ color: 'white' }} />
          </div>
          <h3 className="domain-card-title font-display font-bold">{domain.title}</h3>
          <p className="domain-card-desc">{domain.desc}</p>
        </div>
      </div>
    </label>
  );
}
