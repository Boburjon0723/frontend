'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    // Login State
    const [loginPhone, setLoginPhone] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Dashboard State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [topUps, setTopUps] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [pendingExperts, setPendingExperts] = useState([]);
    const [verifiedExperts, setVerifiedExperts] = useState([]);
    const [expertTab, setExpertTab] = useState('pending'); // 'pending' | 'verified'
    const [jobCategories, setJobCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name_uz: '', name_ru: '', icon: 'Briefcase', price: '100' });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Try to fetch users. If 403, not admin.
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setAuthorized(true);
                fetchData(token);
            } else {
                setLoading(false);
            }
        } catch (e) {
            setLoading(false);
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: loginPhone, password: loginPassword })
            });
            const data = await res.json();

            if (res.ok) {
                if (data.user.role !== 'admin') {
                    setLoginError('This account is not an admin.');
                    return;
                }
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setAuthorized(true);
                fetchData(data.token);
            } else {
                setLoginError(data.message || 'Login failed');
            }
        } catch (err) {
            setLoginError('Connection error');
        }
    };

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchData = async (token: string) => {
        setLoading(true);
        try {
            const [usersRes, topUpsRes, txRes, expertsRes, verifiedRes, categoriesRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/topups`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/experts/pending`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/admin/experts/verified`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/api/jobs/categories`)
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (topUpsRes.ok) setTopUps(await topUpsRes.json());
            if (txRes.ok) setTransactions(await txRes.json());
            if (expertsRes.ok) setPendingExperts(await expertsRes.json());
            if (verifiedRes.ok) setVerifiedExperts(await verifiedRes.json());
            if (categoriesRes.ok) setJobCategories(await categoriesRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTopUp = async (requestId: string) => {
        if (!confirm('Approve this request?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/topups/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ requestId })
            });
            if (res.ok) {
                alert('Approved!');
                fetchData(token!);
            } else {
                const err = await res.json();
                alert('Error: ' + err.message);
            }
        } catch (e) {
            alert('Failed');
        }
    };

    const handleRejectTopUp = async (requestId: string) => {
        if (!confirm('Reject this request?')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/admin/topups/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ requestId })
            });
            fetchData(token!);
        } catch (e) {
            alert('Failed');
        }
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
        const token = localStorage.getItem('token');
        const newStatus = currentStatus ? 'blocked' : 'active';
        if (!confirm(`Mark user as ${newStatus}?`)) return;

        try {
            await fetch(`${API_URL}/api/admin/users/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId, status: newStatus })
            });
            fetchData(token!);
        } catch (e) {
            alert('Failed');
        }
    };

    const handleVerifyExpert = async (userId: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Expert statusini ${status} qilmoqchimisiz?`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/admin/experts/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId, status })
            });
            if (res.ok) {
                alert('Muvaffaqiyatli!');
                fetchData(token!);
            } else {
                const err = await res.json();
                alert('Xato: ' + err.message);
            }
        } catch (e) { alert('Failed'); }
    };

    const handleCreateCategory = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/api/jobs/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name_uz: newCategory.name_uz,
                    name_ru: newCategory.name_ru,
                    icon: newCategory.icon,
                    publication_price_mali: newCategory.price
                })
            });
            if (res.ok) {
                alert('Kategoriya qo\'shildi!');
                setNewCategory({ name_uz: '', name_ru: '', icon: 'Briefcase', price: '100' });
                fetchData(token!);
            }
        } catch (e) { alert('Xato'); }
    };

    const ImageModal = () => (
        selectedImage ? (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
                <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                    <img src={selectedImage} alt="Document" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md text-white/60 text-sm">
                        Rasm yopish uchun istalgan joyga bosing
                    </div>
                </div>
            </div>
        ) : null
    );

    if (loading && !authorized) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-white font-medium animate-pulse">Admin Panel yuklanmoqda...</div>
        </div>
    );

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5 w-full max-w-md shadow-3xl">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2 text-center">Mali Admin</h1>
                    <p className="text-slate-500 text-center mb-8">Tizimga kirish uchun ruxsat kerak</p>
                    <form onSubmit={handleAdminLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-slate-400 text-xs uppercase tracking-widest font-bold ml-1">Telefon raqam</label>
                            <input
                                type="text"
                                value={loginPhone}
                                onChange={e => setLoginPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none transition-all"
                                placeholder="+998..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-slate-400 text-xs uppercase tracking-widest font-bold ml-1">Parol</label>
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 rounded-2xl p-4 text-white placeholder-slate-600 focus:outline-none transition-all"
                                placeholder="********"
                            />
                        </div>
                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
                                {loginError}
                            </div>
                        )}
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20">
                            Dashboardga kirish
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            <ImageModal />
            {/* Header */}
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-600/20">M</div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Admin Control</h1>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-slate-400 text-sm hidden md:block">Bugun: {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}</span>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); window.location.reload(); }} className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl text-sm font-medium transition-all">Logout</button>
                </div>
            </header>

            <div className="max-w-[1400px] mx-auto p-6">
                {/* Navigation Tabs */}
                <nav className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
                    {[
                        { id: 'dashboard', label: 'Dashboard', count: null },
                        { id: 'users', label: 'Foydalanuvchilar', count: users.length },
                        { id: 'topups', label: 'Top-Up', count: topUps.filter((t: any) => t.status === 'pending').length },
                        { id: 'transactions', label: 'Tranzaksiyalar', count: null },
                        { id: 'experts', label: 'Ekspertlar', count: pendingExperts.length },
                        { id: 'jobs', label: 'Ishlar/Narxlar', count: jobCategories.length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab.label}
                            {tab.id === 'experts' ? (
                                pendingExperts.length > 0 && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white`}>
                                        {pendingExperts.length}
                                    </span>
                                )
                            ) : tab.count !== null && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-800'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Umumiy foydalanuvchilar</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold">{users.length}</span>
                                <span className="text-emerald-500 text-sm font-bold mb-1">+12%</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Kutilayotgan to'lovlar</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-amber-500">{topUps.filter((t: any) => t.status === 'pending').length}</span>
                                <span className="text-slate-500 text-sm mb-1">ta ariza</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Tranzaksiyalar</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-emerald-500">{transactions.length}</span>
                                <span className="text-emerald-500 text-sm font-bold mb-1">jami</span>
                            </div>
                        </div>
                        <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Ekspert arizalari</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-indigo-500">{pendingExperts.length}</span>
                                <span className="text-indigo-500 text-sm font-bold mb-1">yangi</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl animate-fade-in">
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <h2 className="text-xl font-bold">Barcha foydalanuvchilar</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/20 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                    <tr>
                                        <th className="p-6">Foydalanuvchi</th>
                                        <th className="p-6">Aloqa</th>
                                        <th className="p-6">Balans</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Amallar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 overflow-hidden">
                                                        {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user.name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[15px]">{user.name} {user.surname}</div>
                                                        <div className="text-slate-500 text-xs">@{user.username || 'username'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[14px] text-slate-300">{user.phone || '+998...'}</div>
                                                <div className="text-[12px] text-slate-500">{user.email || 'Email yo\'q'}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-mono text-emerald-400 font-bold">{parseFloat(user.wallet?.balance || '0').toLocaleString()} MALI</div>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                    {user.is_active ? 'Faol' : 'Bloklangan'}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                                        className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${user.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                                    >
                                                        {user.is_active ? 'Bloklash' : 'Ochish'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TopUps Tab */}
                {activeTab === 'topups' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        {topUps.map((req: any) => (
                            <div key={req.id} className={`bg-slate-900 p-6 rounded-[32px] border transition-all ${req.status === 'pending' ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : 'border-white/5'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-3xl font-mono font-bold text-white mb-1">{parseFloat(req.amount).toLocaleString()} <span className="text-slate-500 text-lg">MALI</span></p>
                                        <p className="text-slate-400 text-sm">{req.name} ({req.phone || req.email})</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                        req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {req.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <span className="text-slate-500 text-xs italic">{new Date(req.created_at).toLocaleString('uz-UZ')}</span>
                                    {req.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproveTopUp(req.id)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all">Tasdiqlash</button>
                                            <button onClick={() => handleRejectTopUp(req.id)} className="px-6 py-2.5 bg-red-600/10 hover:bg-red-600 text-white rounded-2xl font-bold text-sm transition-all">Rad etish</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl animate-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                    <tr>
                                        <th className="p-6">Vaqt</th>
                                        <th className="p-6">Tur</th>
                                        <th className="p-6">Kimdan</th>
                                        <th className="p-6">Kimga</th>
                                        <th className="p-6">Miqdor</th>
                                        <th className="p-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-white/5 transition-all group">
                                            <td className="p-6 text-xs text-slate-500 font-mono">{new Date(t.created_at).toLocaleString('uz-UZ')}</td>
                                            <td className="p-6"><span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase rounded-md border border-indigo-500/20">{t.type}</span></td>
                                            <td className="p-6 text-sm group-hover:text-white transition-colors">{t.sender_name || 'Tizim'}</td>
                                            <td className="p-6 text-sm text-slate-300">{t.receiver_name}</td>
                                            <td className="p-6 font-mono text-emerald-400 font-bold">{parseFloat(t.amount).toLocaleString()}</td>
                                            <td className="p-6 text-[10px] uppercase font-bold text-emerald-500/60 ">{t.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Expert Management Tab */}
                {activeTab === 'experts' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex gap-4 mb-6 bg-white/5 p-1 rounded-2xl w-fit">
                            <button onClick={() => setExpertTab('pending')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${expertTab === 'pending' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Yangi arizalar ({pendingExperts.length})</button>
                            <button onClick={() => setExpertTab('verified')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${expertTab === 'verified' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Tasdiqlanganlar ({verifiedExperts.length})</button>
                        </div>

                        {(expertTab === 'pending' ? pendingExperts : verifiedExperts).map((exp: any) => (
                            <div key={exp.id} className="bg-slate-900/80 backdrop-blur-md p-8 rounded-[40px] border border-white/5 flex flex-col gap-8 shadow-2xl hover:border-indigo-500/30 transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                    <div className="flex gap-6 items-start">
                                        <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-white/10 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                            {exp.avatar_url ? <img src={exp.avatar_url} className="w-full h-full object-cover" /> : <span className="text-3xl font-bold text-indigo-400">{exp.name[0]}</span>}
                                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-bold text-white">{exp.name} {exp.surname}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-indigo-400 font-bold text-sm bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20 uppercase tracking-wider">{exp.profession}</span>
                                                <span className="text-slate-500 text-sm">@{exp.username}</span>
                                            </div>
                                            <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-xl italic">{exp.bio_expert || 'Biografiya kiritilmagan.'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 bg-white/5 p-4 rounded-[28px] border border-white/5 min-w-[200px]">
                                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Xizmat narxi</span>
                                        <div className="text-3xl font-mono font-bold text-emerald-400">{parseFloat(exp.hourly_rate).toLocaleString()} <span className="text-sm font-sans">{exp.currency}</span></div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">1 soat uchun</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-black/20 p-5 rounded-3xl space-y-3">
                                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Professional Ma'lumot
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Tajriba:</span> <span className="font-bold text-white">{exp.experience_years} yil</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Ta'lim:</span> <span className="font-bold text-white">{exp.institution || 'Mavjud emas'}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Yo'nalish:</span> <span className="font-bold text-indigo-400">{exp.specialization_details || 'Batafsil..'}</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-5 rounded-3xl space-y-3">
                                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Xizmat tafsilotlari
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Tillar:</span> <span className="font-bold text-white">{exp.service_languages || 'Kiritilmagan'}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Format:</span> <span className="font-bold text-white">{exp.service_format || 'Mavjud emas'}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-400">Diplom:</span> <span className={`font-bold ${exp.has_diploma ? 'text-emerald-400' : 'text-red-400'}`}>{exp.has_diploma ? 'Mavjud' : 'Yo\'q'}</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 p-5 rounded-3xl space-y-3">
                                        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div> Tasdiqlash hujjatlari
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {exp.diploma_url && (
                                                <button onClick={() => setSelectedImage(exp.diploma_url)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 transition-all text-xs flex flex-col items-center gap-1 group">
                                                    <span className="text-slate-500 group-hover:text-indigo-400 transition-colors">Diplom</span>
                                                    <div className="w-full h-1 bg-indigo-500/20 rounded-full hidden group-hover:block animate-grow-x"></div>
                                                </button>
                                            )}
                                            {exp.id_url && (
                                                <button onClick={() => setSelectedImage(exp.id_url)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 transition-all text-xs flex flex-col items-center gap-1 group">
                                                    <span className="text-slate-500 group-hover:text-amber-400 transition-colors">Passport / ID</span>
                                                    <div className="w-full h-1 bg-amber-500/20 rounded-full hidden group-hover:block animate-grow-x"></div>
                                                </button>
                                            )}
                                            {exp.selfie_url && (
                                                <button onClick={() => setSelectedImage(exp.selfie_url)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 transition-all text-xs flex flex-col items-center gap-1 group">
                                                    <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">Selfie</span>
                                                </button>
                                            )}
                                            {exp.certificate_url && (
                                                <button onClick={() => setSelectedImage(exp.certificate_url)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 transition-all text-xs flex flex-col items-center gap-1 group">
                                                    <span className="text-slate-500 group-hover:text-pink-400 transition-colors">Sertifikat</span>
                                                </button>
                                            )}
                                            {exp.resume_url && (
                                                <button
                                                    onClick={() => window.open(exp.resume_url, '_blank')}
                                                    className="p-3 bg-indigo-500/10 rounded-2xl hover:bg-indigo-500/20 border border-indigo-500/20 transition-all text-xs flex flex-col items-center gap-1 group col-span-2"
                                                >
                                                    <span className="text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                        REZYUMENI KO'RISH (PDF)
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    {exp.verified_status === 'pending' ? (
                                        <>
                                            <button onClick={() => handleVerifyExpert(exp.id, 'approved')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] py-4 rounded-[24px] font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Ekspertni tasdiqlash
                                            </button>
                                            <button onClick={() => handleVerifyExpert(exp.id, 'rejected')} className="px-8 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-[24px] font-bold border border-red-500/20 transition-all">
                                                Rad etish
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex-1 p-4 rounded-[24px] bg-white/5 flex items-center justify-center gap-4">
                                            <span className={`font-bold uppercase tracking-widest text-sm ${exp.verified_status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                Status: {exp.verified_status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
                                            </span>
                                            <button onClick={() => handleVerifyExpert(exp.id, exp.verified_status === 'approved' ? 'rejected' : 'approved')} className="text-[10px] px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">Statusni o'zgartirish</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {(expertTab === 'pending' ? pendingExperts : verifiedExperts).length === 0 && (
                            <div className="bg-slate-900/50 p-20 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                </div>
                                <p className="text-slate-500 font-medium">Hozircha kutilayotgan arizalar mavjud emas.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Job / Category Management Tab */}
                {activeTab === 'jobs' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Add Category Form */}
                        <div className="bg-slate-900 p-8 rounded-[40px] border border-white/5 shadow-2xl">
                            <h2 className="text-xl font-bold mb-6">Yangi kategoriya qo'shish</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Nomi (UZ)</label>
                                    <input type="text" value={newCategory.name_uz} onChange={e => setNewCategory({ ...newCategory, name_uz: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" placeholder="Huquqshunos" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Nomi (RU)</label>
                                    <input type="text" value={newCategory.name_ru} onChange={e => setNewCategory({ ...newCategory, name_ru: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" placeholder="Юрист" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Ikonka (Lucide Name)</label>
                                    <input type="text" value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" placeholder="Gavel" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Narxi (MALI)</label>
                                    <input type="number" value={newCategory.price} onChange={e => setNewCategory({ ...newCategory, price: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" placeholder="100" />
                                </div>
                            </div>
                            <button onClick={handleCreateCategory} className="mt-6 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all">Qo'shish</button>
                        </div>

                        {/* Category List */}
                        <div className="bg-slate-900 rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="bg-black/20 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="p-6">Ikonka</th>
                                        <th className="p-6">UZ Nomi</th>
                                        <th className="p-6">RU Nomi</th>
                                        <th className="p-6">E'lon narxi</th>
                                        <th className="p-6">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {jobCategories.map((cat: any) => (
                                        <tr key={cat.id} className="hover:bg-white/5 transition-all">
                                            <td className="p-6 text-indigo-400 font-bold">{cat.icon}</td>
                                            <td className="p-6 font-bold">{cat.name_uz}</td>
                                            <td className="p-6 text-slate-400">{cat.name_ru}</td>
                                            <td className="p-6 font-mono text-emerald-400 font-bold">{parseFloat(cat.publication_price_mali).toLocaleString()} MALI</td>
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">FAOL</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes grow-x {
                    from { width: 0; }
                    to { width: 100%; }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
                .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-grow-x { animation: grow-x 0.3s ease-out forwards; }
            `}</style>
        </div >
    );
}

