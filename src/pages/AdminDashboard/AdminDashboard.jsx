import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DOMAIN_QUESTIONS } from '../../data/questions';
import { Users, LogOut, ChevronRight, User as UserIcon, Search, Trash2, Download } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnswers, setUserAnswers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (localStorage.getItem('sae_admin_auth') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      if (!db) return;
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList.sort((a, b) => (b.submittedAt?.toMillis() || 0) - (a.submittedAt?.toMillis() || 0)));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setLoadingAnswers(true);
    setUserAnswers(null);

    if (!user.domains || !db) {
      setLoadingAnswers(false);
      return;
    }

    try {
      const answersMap = {};
      for (const domain of user.domains) {
        const q = query(collection(db, domain), where('email', '==', user.email));
        const domainSnap = await getDocs(q);
        if (!domainSnap.empty) {
          answersMap[domain] = domainSnap.docs[0].data().responses;
        }
      }
      setUserAnswers(answersMap);
    } catch (err) {
      console.error("Error fetching answers:", err);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !db) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedUser.name || selectedUser.email}?`)) return;
    
    setLoadingAnswers(true);
    try {
      if (selectedUser.domains) {
        for (const domain of selectedUser.domains) {
          const q = query(collection(db, domain), where('email', '==', selectedUser.email));
          const snap = await getDocs(q);
          for (const document of snap.docs) {
            await deleteDoc(doc(db, domain, document.id));
          }
        }
      }
      
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      setUserAnswers(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    } finally {
      setLoadingAnswers(false);
    }
  };

  const handleExportToSheets = async () => {
    alert("Uploading to Google Sheets...");

    for (const u of filteredUsers) {
      if (!u.domains) continue;

      for (const domain of u.domains) {
        let answersStr = "";

        const q = query(collection(db, domain), where('email', '==', u.email));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const resp = snap.docs[0].data().responses;
          answersStr = Object.values(resp).join(" | ");
        }

        await fetch("https://script.google.com/macros/s/AKfycbww6Ku32V2SAQwH3KhFLYqi3DxQLPGuXJDDSm0XfHi-Qh7vSzBVetDQnLp2LCwmmxV5fw/exec", {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify({
            domain: domain,
            name: u.name,
            email: u.email,
            rollNo: u.rollNo,
            whatsapp: u.whatsapp,
            year: u.year,
            gender: u.gender,
            branch: u.branch,
            allDomains: (u.domains || []).join(" | "),
            answers: answersStr
          }),
        });
      }
    }

    setTimeout(() => {
      alert("Upload completed (check Google Sheets)");
    }, 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('sae_admin_auth');
    navigate('/admin');
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container animate-fade-in p-6 max-w-[1400px]">
      <div className="flex justify-between items-center mb-8 pb-5 border-b border-border-color">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Users size={24} className="text-white" />
          </div>
          <h2 className="m-0 font-display font-bold text-2xl">Admin Dashboard</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportToSheets} className="btn-secondary flex items-center gap-2 px-4 py-2.5 bg-white/5">
            <Download size={16} /> Export to Google Sheets
          </button>
          <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 px-4 py-2.5">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start">
          
          {/* Left Column - Users List */}
          <div className="glass-panel p-6 h-[calc(100vh-160px)] overflow-y-auto">
            <div className="relative mb-5">
              <input 
                type="text" 
                className="input-field pl-10" 
                placeholder="Search name, email, roll..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-3.5 text-text-secondary" />
            </div>

            <h3 className="text-[1.1rem] mb-4 text-text-secondary font-display font-medium">
              Submissions ({filteredUsers.length})
            </h3>
            
            {loading ? (
              <p className="text-text-secondary">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-text-secondary">No submissions found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredUsers.map((u) => (
                  <button 
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left flex items-center justify-between p-4 rounded-lg transition-all duration-200 border ${selectedUser?.id === u.id ? 'bg-[rgba(229,9,20,0.15)] border-primary' : 'bg-black/20 border-border-color hover:border-white/30'}`}
                  >
                    <div className="overflow-hidden pr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <UserIcon size={16} className="text-primary shrink-0" />
                        <span className="font-medium text-white truncate w-[200px] inline-block align-bottom">
                          {u.name || u.email}
                        </span>
                      </div>
                      <span className="text-sm text-text-secondary">
                        {u.branch ? `${u.branch} • ` : ''}{u.domains?.length || 0} domains apply
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-text-secondary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - User Details */}
          <div className="glass-panel p-8 h-[calc(100vh-160px)] overflow-y-auto">
            {!selectedUser ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                <Users size={64} className="opacity-20 mb-4" />
                <p>Select a user to view their complete submission.</p>
              </div>
            ) : (
              <div>
                <div className="mb-8 pb-5 border-b border-border-color">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl mb-1 font-display font-bold">{selectedUser.name || 'Applicant'}</h2>
                      <p className="text-[1.1rem] text-primary">{selectedUser.email}</p>
                    </div>
                    <button onClick={handleDeleteUser} className="btn-secondary flex items-center gap-2 px-4 py-2 border-primary text-primary hover:bg-[rgba(229,9,20,0.1)]">
                      <Trash2 size={16} /> Delete User
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 bg-white/5 p-4 rounded-lg">
                    <div><span className="text-text-secondary text-sm block mb-1">Roll No:</span><strong className="text-white">{selectedUser.rollNo || 'N/A'}</strong></div>
                    <div><span className="text-text-secondary text-sm block mb-1">WhatsApp:</span><strong className="text-white">{selectedUser.whatsapp || 'N/A'}</strong></div>
                    <div><span className="text-text-secondary text-sm block mb-1">Branch:</span><strong className="text-white">{selectedUser.branch || 'N/A'}</strong></div>
                    <div><span className="text-text-secondary text-sm block mb-1">Year:</span><strong className="text-white">{selectedUser.year || 'N/A'}</strong></div>
                    <div><span className="text-text-secondary text-sm block mb-1">Gender:</span><strong className="text-white">{selectedUser.gender || 'N/A'}</strong></div>
                    <div><span className="text-text-secondary text-sm block mb-1">Submitted At:</span><strong className="text-white">{selectedUser.submittedAt ? new Date(selectedUser.submittedAt.seconds * 1000).toLocaleString() : 'Unknown'}</strong></div>
                  </div>
                </div>

                {loadingAnswers ? (
                  <p className="text-text-secondary">Fetching their answers from the database...</p>
                ) : !userAnswers ? (
                  <p className="text-text-secondary">Could not load answers.</p>
                ) : (
                  <div>
                    {selectedUser.domains?.map((domainId) => {
                      const domainMeta = DOMAIN_QUESTIONS[domainId];
                      const domainResponses = userAnswers[domainId];

                      if (!domainMeta) return null;

                      return (
                        <div key={domainId} className="mb-10">
                          <h3 className="font-display font-bold text-primary" style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                            {domainMeta.title}
                          </h3>
                          
                          {domainResponses ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                              {domainMeta.questions.map((q, idx) => {
                                const answer = domainResponses[q.id];
                                return (
                                  <div key={q.id} className="admin-answer-box">
                                    <p className="admin-answer-q">
                                      <strong className="text-white">Q{idx + 1}: </strong> {q.text}
                                    </p>
                                    <div className="admin-answer-a">
                                      {answer ? answer : <em className="text-primary opacity-80">No answer provided</em>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-text-secondary italic">No responses found in the database for this domain.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
