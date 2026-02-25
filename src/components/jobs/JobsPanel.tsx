
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';

const CATEGORIES = [
    { id: 'it', label: 'IT va Dasturlash', icon: '💻', type: 'online' },
    { id: 'design', label: 'Dizayn va Media', icon: '🎨', type: 'online' },
    { id: 'smm', label: 'SMM va Matn', icon: '✍️', type: 'online' },
    { id: 'education', label: 'Ta\'lim va O\'quv', icon: '🎓', type: 'both' },
    { id: 'tech', label: 'Texnik Ustalar', icon: '🔧', type: 'offline' },
    { id: 'sales', label: 'Savdo va Xizmat', icon: '🛍', type: 'offline' },
    { id: 'logistics', label: 'Kuryer va Haydovchi', icon: '🚚', type: 'offline' },
];

export default function JobsPanel() {
    const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
    const [searchTerm, setSearchTerm] = useState('');
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await fetch(`${API_URL}/api/jobs?type=${activeTab === 'online' ? 'online' : 'all'}`); // Simple filter logic
                if (response.ok) {
                    const data = await response.json();
                    setJobs(data);
                }
            } catch (error) {
                console.error("Failed to fetch jobs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [activeTab]); // Refetch when tab changes

    const filteredCategories = CATEGORIES.filter(c => c.type === activeTab || c.type === 'both');

    const filteredJobs = jobs.filter(job =>
        (activeTab === 'online' ? job.type === 'online' : job.type === 'offline') &&
        job.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full gap-4 text-white">
            {/* Header / Tabs */}
            <div className="flex items-center gap-2 px-2">
                <button
                    onClick={() => setActiveTab('online')}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'online'
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/30 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/50'
                        }`}
                >
                    Online Ishlar
                </button>
                <button
                    onClick={() => setActiveTab('offline')}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'offline'
                        ? 'bg-purple-600 shadow-lg shadow-purple-500/30 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-white/50'
                        }`}
                >
                    Offline (Joyda)
                </button>
            </div>

            {/* Search */}
            <div className="px-2">
                <GlassCard className="!p-3 flex items-center gap-2 bg-white/5 border-white/10 !rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ish yoki mutaxassis qidirish..."
                        className="bg-transparent border-none outline-none text-white w-full placeholder-white/40 text-sm"
                    />
                </GlassCard>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-4">

                {/* Categories Horizontal Scroll */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Kategoriyalar</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {filteredCategories.map(cat => (
                            <button key={cat.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center gap-3 transition-colors text-left">
                                <span className="text-xl">{cat.icon}</span>
                                <span className="text-sm font-medium text-white/80">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Job Listings */}
                <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">So'nggi E'lonlar</h3>
                    {loading ? (
                        <div className="text-center py-10 text-white/30 text-sm">Yuklanmoqda...</div>
                    ) : filteredJobs.length > 0 ? (
                        filteredJobs.map(job => (
                            <GlassCard key={job.id} hoverEffect={true} className="!p-4 !bg-white/5 border-white/10 cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{job.title}</h4>
                                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded font-mono">
                                        {job.price}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-white/50">
                                    <span>{job.user?.name || 'Unknown User'}</span>
                                    <span>•</span>
                                    <span className="capitalize">{job.category}</span>
                                </div>
                            </GlassCard>
                        ))
                    ) : (
                        <div className="text-center py-10 text-white/30 text-sm">
                            Hozircha e'lonlar yo'q
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
