import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassDatePicker } from '../ui/GlassDatePicker';
import { useSocket } from '@/context/SocketContext';
import {
    User,
    Bell,
    Lock,
    MessageSquare,
    Folder,
    Sliders,
    Volume2,
    Zap,
    Languages,
    Monitor,
    Search,
    MoreVertical,
    X,
    Grid,
    Camera,
    AtSign,
    Phone,
    Calendar,
    Award,
    Briefcase,
    Clock,
    DollarSign,
    Heart,
    Image as ImageIcon,
    Film,
    FileText,
    Moon,
    CheckCircle,
    Shield,
    UserCheck,
    Plus
} from 'lucide-react';

interface ProfileViewerProps {
    onClose: () => void;
    onEdit: () => void;
    onLogout: () => void;
    user?: any;
    mode?: 'profile' | 'settings';
    bgSettings?: { blur: number; imageBlur?: number; image: string; isDark?: boolean; rgb?: { r: number, g: number, b: number } };
    onUpdateBgBlur?: (val: number) => void;
    onUpdateBgImageBlur?: (val: number) => void;
    onUpdateBgImage?: (url: string) => void;
    onUpdateBgRGB?: (rgb: { r: number, g: number, b: number }) => void;
    onUpdateTheme?: (dark: boolean) => void;
}

export default function ProfileViewer({
    onClose,
    onEdit,
    onLogout,
    user: propUser,
    mode = 'settings',
    bgSettings,
    onUpdateBgBlur,
    onUpdateBgImageBlur,
    onUpdateBgImage,
    onUpdateBgRGB,
    onUpdateTheme
}: ProfileViewerProps) {
    const { socket } = useSocket();
    const [localUser, setLocalUser] = useState<any>(null);
    const [currentView, setCurrentView] = useState<'main' | 'chat_settings' | 'wallet'>('main');

    // Wallet State
    const [walletData, setWalletData] = useState({ available: 0, locked: 0, subscription_end_date: null as string | null });
    const [isSubscribing, setIsSubscribing] = useState(false);

    // Language State
    const [language, setLanguage] = useState<'uz' | 'ru' | 'en'>('ru');
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Profile Edit States
    const [bio, setBio] = useState("");
    const [birthday, setBirthday] = useState("");
    const [showNameModal, setShowNameModal] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showExpertModal, setShowExpertModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editUsername, setEditUsername] = useState("");

    // Expert States
    const [isExpert, setIsExpert] = useState(false);
    const [verifiedStatus, setVerifiedStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [profession, setProfession] = useState("");
    const [specializationDetails, setSpecializationDetails] = useState("");
    const [experience, setExperience] = useState(0);
    const [hasDiploma, setHasDiploma] = useState(false);
    const [institution, setInstitution] = useState("");
    const [currentWorkplace, setCurrentWorkplace] = useState("");
    const [diplomaUrl, setDiplomaUrl] = useState("");
    const [certificateUrl, setCertificateUrl] = useState("");
    const [idUrl, setIdUrl] = useState("");
    const [selfieUrl, setSelfieUrl] = useState("");
    const [price, setPrice] = useState(0);
    const [currency, setCurrency] = useState("MALI");
    const [serviceLanguages, setServiceLanguages] = useState("");
    const [serviceFormat, setServiceFormat] = useState("");
    const [bioExpert, setBioExpert] = useState("");
    const [specialtyDesc, setSpecialtyDesc] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [anketaUrl, setAnketaUrl] = useState("");

    // Refs for focusing missing fields
    const professionRef = useRef<HTMLSelectElement | null>(null);
    const experienceRef = useRef<HTMLInputElement | null>(null);
    const priceRef = useRef<HTMLInputElement | null>(null);

    // Field-level error states for visual validation
    const [expertErrors, setExpertErrors] = useState<{
        profession?: string;
        experience?: string;
        price?: string;
        selfie?: string;
        resume?: string;
        anketa?: string;
        groups?: string;
    }>({});
    const [servicesJson, setServicesJson] = useState<any[]>([]);
    const [expertGroups, setExpertGroups] = useState<{ id: string, name: string, time: string, chatId?: string }[]>([]);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupTime, setNewGroupTime] = useState("10:00");
    const [expertFee, setExpertFee] = useState(50);

    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

    const isMentorProfession = (prof: string) => {
        return ['O\'qituvchi', 'Mentor', 'Startap mentori', 'Dasturchi mentor'].includes(prof);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const diplomaRef = useRef<HTMLInputElement>(null);
    const certRef = useRef<HTMLInputElement>(null);
    const idRef = useRef<HTMLInputElement>(null);
    const selfieRef = useRef<HTMLInputElement>(null);
    const resumeRef = useRef<HTMLInputElement>(null);
    const anketaRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('user');
            const storedLang = localStorage.getItem('app-lang');
            if (storedLang) setLanguage(storedLang as any);

            const userToProcess = propUser || (stored ? JSON.parse(stored) : null);

            if (userToProcess) {
                setLocalUser(userToProcess);
                setBio(userToProcess.bio || "");

                if (userToProcess.birthday) {
                    const d = new Date(userToProcess.birthday);
                    if (!isNaN(d.getTime())) {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        setBirthday(`${y}-${m}-${day}`);
                    }
                } else {
                    setBirthday("");
                }

                setIsExpert(userToProcess.is_expert || false);
                setVerifiedStatus(userToProcess.verified_status || 'none');
                setProfession(userToProcess.profession || "");
                setSpecializationDetails(userToProcess.specialization_details || "");
                setExperience(userToProcess.experience_years || 0);
                setHasDiploma(userToProcess.has_diploma || false);
                setInstitution(userToProcess.institution || "");
                setCurrentWorkplace(userToProcess.current_workplace || "");
                setDiplomaUrl(userToProcess.diploma_url || "");
                setCertificateUrl(userToProcess.certificate_url || "");
                setIdUrl(userToProcess.id_url || "");
                setSelfieUrl(userToProcess.selfie_url || "");
                const rawPrice = userToProcess.hourly_rate || userToProcess.service_price || 0;
                setPrice(parseFloat(rawPrice as any) || 0);
                setCurrency(userToProcess.currency || "MALI");
                setServiceLanguages(userToProcess.service_languages || "");
                setServiceFormat(userToProcess.service_format || "");
                setBioExpert(userToProcess.bio_expert || "");
                setSpecialtyDesc(userToProcess.specialty_desc || "");
                setResumeUrl(userToProcess.resume_url || "");
                setAnketaUrl(userToProcess.anketa_url || "");
                try {
                    setServicesJson(userToProcess.services_json ? (typeof userToProcess.services_json === 'string' ? JSON.parse(userToProcess.services_json) : userToProcess.services_json) : []);
                } catch { setServicesJson([]); }

                try {
                    setExpertGroups(userToProcess.expert_groups ? (typeof userToProcess.expert_groups === 'string' ? JSON.parse(userToProcess.expert_groups) : userToProcess.expert_groups) : []);
                } catch { setExpertGroups([]); }
            }
        } catch (e) {
            console.error("Failed to load user profile", e);
        }
    }, [propUser]);

    useEffect(() => {
        if (!socket) return;
        socket.on('profile_updated', (data: any) => {
            const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = { ...oldUser, ...data };
            localStorage.setItem('user', JSON.stringify(newUser));
            setLocalUser(newUser);
        });
        socket.on('expert_status_updated', (data: { userId: string, status: string }) => {
            const oldUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (oldUser.id === data.userId) {
                console.log('[ProfileViewer] Status updated from socket:', data.status);
                const newUser = { ...oldUser, verified_status: data.status, is_expert: data.status === 'approved' };
                localStorage.setItem('user', JSON.stringify(newUser));
                setLocalUser(newUser);
                setVerifiedStatus(data.status as any);
                setIsExpert(data.status === 'approved');
            }
        });
        return () => {
            socket.off('profile_updated');
            socket.off('expert_status_updated');
        };
    }, [socket]);

    const user = propUser || localUser || {};

    const calculateAge = (dob: string) => {
        if (!dob) return null;
        try {
            const birthDate = new Date(dob);
            if (isNaN(birthDate.getTime())) return null;
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age >= 0 ? age : null;
        } catch { return null; }
    };

    const handleSaveLanguage = (lang: 'uz' | 'ru' | 'en') => {
        setLanguage(lang);
        localStorage.setItem('app-lang', lang);
        setShowLanguageModal(false);
    };

    const handleSaveBio = (newBio: string) => {
        if (newBio !== user.bio) {
            if (socket) socket.emit('update_profile', { bio: newBio });
            const newUser = { ...user, bio: newBio };
            setLocalUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
        }
    };

    const handleSaveBirthday = (val: string) => {
        if (val !== birthday) {
            setBirthday(val);
            if (socket) socket.emit('update_profile', { birthday: val });
            const newUser = { ...user, birthday: val };
            setLocalUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
        }
    };

    const handleSaveName = () => {
        const payload = { name: editFirstName, surname: editLastName };
        if (socket) socket.emit('update_profile', payload);
        setShowNameModal(false);
    };

    const handleSaveUsername = () => {
        if (socket) socket.emit('update_profile', { username: editUsername });
        setShowUsernameModal(false);
    };

    const handleSaveExpertData = async () => {
        setExpertErrors({});
        // Step-by-step required field checks with focus/scroll
        if (!profession) {
            setToast({ type: 'warning', message: "Kasb maydonini to'ldiring." });
            setExpertErrors(prev => ({ ...prev, profession: "Kasbni tanlash majburiy." }));
            professionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            professionRef.current?.focus();
            return;
        }

        if (!experience || experience <= 0) {
            setToast({ type: 'warning', message: "Tajriba (yil) maydonini to'g'ri kiriting." });
            setExpertErrors(prev => ({ ...prev, experience: "Tajriba 0 dan katta bo'lishi kerak." }));
            experienceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            experienceRef.current?.focus();
            return;
        }

        if (!price || price <= 0) {
            setToast({ type: 'warning', message: "Soatlik narx (MALI) maydonini to'g'ri kiriting." });
            setExpertErrors(prev => ({ ...prev, price: "Narx 0 dan katta bo'lishi kerak." }));
            priceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            priceRef.current?.focus();
            return;
        }

        if (!selfieUrl) {
            setToast({ type: 'warning', message: "Selfie faylini yuklash majburiy." });
            setExpertErrors(prev => ({ ...prev, selfie: "Selfie yuklash majburiy." }));
            selfieRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!resumeUrl) {
            setToast({ type: 'warning', message: "Rezyume (PDF) faylini yuklang." });
            setExpertErrors(prev => ({ ...prev, resume: "Rezyume (PDF) yuklash majburiy." }));
            resumeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!anketaUrl) {
            setToast({ type: 'warning', message: "Anketa faylini yuklash majburiy." });
            setExpertErrors(prev => ({ ...prev, anketa: "Anketa fayli majburiy." }));
            anketaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (isMentorProfession(profession) && expertGroups.length === 0) {
            setToast({ type: 'warning', message: "Mentorlar uchun kamida bitta guruh qo'shish majburiy." });
            setExpertErrors(prev => ({ ...prev, groups: "Mentor uchun kamida bitta guruh qo'shing." }));
            return;
        }

        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app';

        // Create actual chat groups for new expert groups
        const updatedGroups = [...expertGroups];
        let createdAny = false;
        for (let i = 0; i < updatedGroups.length; i++) {
            const grp = updatedGroups[i];
            if (!grp.chatId) {
                try {
                    console.log(`[ProfileViewer] Creating chat group for: ${grp.name}`);
                    const res = await fetch(`${apiUrl}/api/chats`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ type: 'group', name: grp.name, participants: [] })
                    });
                    if (res.ok) {
                        const newChat = await res.json();
                        console.log(`[ProfileViewer] Created chat:`, newChat);
                        updatedGroups[i].chatId = newChat.id || newChat._id;
                        createdAny = true;
                    } else {
                        const errData = await res.json();
                        console.error("[ProfileViewer] Failed to create chat group:", errData);
                    }
                } catch (err) {
                    console.error("[ProfileViewer] Error creating chat group:", err);
                }
            }
        }

        if (createdAny) {
            setExpertGroups(updatedGroups);
        }

        const payload = {
            is_expert: isExpert,
            profession,
            specialization_details: specializationDetails,
            specialization: specializationDetails || profession,
            experience_years: experience,
            has_diploma: hasDiploma,
            institution,
            current_workplace: currentWorkplace,
            diploma_url: diplomaUrl,
            certificate_url: certificateUrl,
            id_url: idUrl,
            selfie_url: selfieUrl,
            hourly_rate: parseFloat(price as any) || 0,
            currency,
            service_languages: serviceLanguages,
            service_format: serviceFormat,
            bio_expert: bioExpert,
            specialty_desc: specialtyDesc,
            resume_url: resumeUrl,
            anketa_url: anketaUrl,
            services_json: JSON.stringify(servicesJson),
            expert_groups: JSON.stringify(updatedGroups),
            expert_fee_total: expertFee,
            verified_status: 'pending'
        };
        const apiPayload = {
            name: user.name,
            surname: user.surname || '',
            username: user.username || '',
            ...payload
        };
        try {
            const res = await fetch(`${apiUrl}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(apiPayload)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Saqlash muvaffaqiyatsiz');
            }
        } catch (e: any) {
            setToast({
                type: 'error',
                message: e?.message || "Server bilan aloqa xatosi. Qayta urinib ko'ring."
            });
            return;
        }
        if (socket) socket.emit('update_profile', payload);
        const newUser = { ...user, ...payload };
        setLocalUser(newUser);
        // Avoid storing large base64 fayllarini localStorage ichida saqlash (quota xatosini oldini olish)
        const userForStorage: any = { ...newUser };
        delete userForStorage.diploma_url;
        delete userForStorage.certificate_url;
        delete userForStorage.id_url;
        delete userForStorage.selfie_url;
        delete userForStorage.resume_url;
        delete userForStorage.anketa_url;
        try {
            localStorage.setItem('user', JSON.stringify(userForStorage));
        } catch (e) {
            console.warn('localStorage user quota exceeded, skipping full save', e);
        }
        setVerifiedStatus('pending');
        setIsExpert(true);
        setShowExpertModal(false);
        setToast({
            type: 'success',
            message: "Mutaxassis ma'lumotlari tasdiqlash uchun yuborildi. Admin tasdig'ini kuting.",
        });
    };

    const handleDocumentUpload = (key: string, file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (key === 'diploma') setDiplomaUrl(base64);
            if (key === 'cert') setCertificateUrl(base64);
            if (key === 'id') setIdUrl(base64);
            if (key === 'selfie') setSelfieUrl(base64);
            if (key === 'resume') setResumeUrl(base64);
            if (key === 'anketa') setAnketaUrl(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setLocalUser({ ...user, avatar: base64 });
                if (socket) socket.emit('update_profile', { avatar: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchWallet = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/api/wallet/balance`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setWalletData({
                        available: data.data.available_balance || 0,
                        locked: data.data.locked_balance || 0,
                        subscription_end_date: user.subscription_end_date || null
                    });
                }
            }
        } catch (e) {
            console.error('Failed to fetch wallet', e);
        }
    };

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-6de74.up.railway.app'}/api/wallet/subscribe`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setToast({ type: 'success', message: "Mutaxassis obunasi muvaffaqiyatli faollashtirildi." });
                fetchWallet();
                setVerifiedStatus('pending');
                setIsExpert(true);
            } else {
                setToast({
                    type: 'error',
                    message: data.message || "Obuna bo'lishda xatolik yuz berdi. Balansingizni va internet aloqangizni tekshiring.",
                });
            }
        } catch (e) {
            setToast({
                type: 'error',
                message: "Tarmoq xatosi. Keyinroq yana urinib ko'ring.",
            });
        } finally {
            setIsSubscribing(false);
        }
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const getAvatarUrl = (path: string) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    // Auto-hide toast after a short delay
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    // --- RENDERERS ---

    const renderProfile = () => (
        <div
            className={`w-full h-full lg:h-auto lg:max-w-[420px] flex flex-col lg:max-h-[85vh] overflow-hidden rounded-none lg:rounded-[24px] shadow-2xl animate-scale-up border lg:border-white/10 text-white`}
            style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)`, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header with Big Image */}
            <div className="relative h-[220px] w-full overflow-hidden flex-shrink-0">
                <img
                    src={getAvatarUrl(user.avatar || user.avatar_url) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"}
                    className="w-full h-full object-cover brightness-75 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121B22] via-transparent to-black/30"></div>

                <div className="absolute top-0 inset-x-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center z-10">
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all border border-white/10 flex items-center gap-1 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        <X className="h-5 w-5 hidden lg:block" />
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => setShowLanguageModal(true)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all flex items-center gap-2 px-3 border border-white/10">
                            <Languages className="h-4 w-4" />
                            <span className="text-[11px] font-bold uppercase">{language}</span>
                        </button>
                        <button className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all border border-white/10"><MoreVertical className="h-5 w-5" /></button>
                    </div>
                </div>

                <div className="absolute bottom-4 left-6 right-6 z-10">
                    <h2 className="text-white text-2xl font-bold leading-none">{user.name} {user.surname || ''}</h2>
                    <p className="text-[#00A884] text-[13px] font-medium mt-1">в сети</p>
                </div>

                <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-4 right-6 w-11 h-11 bg-accent-primary rounded-full flex items-center justify-center text-white shadow-xl hover:bg-blue-600 transition-all transform active:scale-95 z-20"
                >
                    <Camera className="h-5 w-5" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </button>
            </div>

            {verifiedStatus === 'pending' && (
                <div className="mx-6 mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div className="flex flex-col">
                        <span className="text-yellow-500 font-bold text-xs uppercase tracking-wider">Tasdiqlanishi kutilmoqda</span>
                        <span className="text-white/40 text-[10px]">Ma'lumotlaringiz moderator tomonidan ko'rib chiqilmoqda.</span>
                    </div>
                </div>
            )}

            <div className="overflow-y-auto custom-scrollbar flex-1 pb-8">
                {/* Info Items */}
                <div className="p-4 space-y-1">
                    <div className="flex items-center gap-6 px-4 py-3 hover:bg-white/5 rounded-[15px] cursor-default transition-colors group">
                        <Phone className="h-5 w-5 text-[#00A884]/80" />
                        <div className="flex flex-col">
                            <span className="text-white text-[15px]">{user.phone || '+998 -- --- -- --'}</span>
                            <span className="text-white/30 text-[12px]">Телефон</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 px-4 py-3 hover:bg-white/5 rounded-[15px] cursor-pointer group transition-colors"
                        onClick={() => { setEditUsername(user.username || ""); setShowUsernameModal(true); }}>
                        <AtSign className="h-5 w-5 text-[#00A884]/80" />
                        <div className="flex flex-col">
                            <span className="text-white text-[15px]">@{user.username || 'username'}</span>
                            <span className="text-white/30 text-[12px]">Имя пользователя</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 px-4 py-3 hover:bg-white/5 rounded-[15px] transition-colors relative group cursor-pointer"
                        onClick={() => setShowDatePicker(true)}
                    >
                        <Calendar className="h-5 w-5 text-[#00A884]/80 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col flex-1">
                            <span className="text-white text-[15px]">
                                {birthday ? new Date(birthday).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }) : (language === 'ru' ? 'Указать дату' : 'Sana tanlang')}
                                {birthday && calculateAge(birthday) !== null && ` (${calculateAge(birthday)} ${language === 'ru' ? 'лет' : 'yosh'})`}
                            </span>
                            <span className="text-white/30 text-[12px]">{language === 'ru' ? 'День рождения' : 'Tug\'ilgan kun'}</span>
                        </div>
                    </div>
                </div>

                <div className="h-[1px] bg-white/5 mx-6"></div>

                {/* Expert Status */}
                <div className="p-6">
                    <div className={`p-5 rounded-[20px] border transition-all cursor-pointer ${isExpert ? 'bg-accent-primary/10 border-accent-primary/30 shadow-lg shadow-accent-primary/5' : 'bg-white/5 border-white/10 hover:border-white/20'}`} onClick={() => setShowExpertModal(true)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Award className={`h-6 w-6 ${isExpert ? 'text-[#00A884]' : 'text-white/20'}`} />
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-[16px]">Mutaxassis rejimi</h4>
                                    {verifiedStatus === 'approved' && <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Faollashtirilgan</span>}
                                    {verifiedStatus === 'pending' && (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-wider">Tekshirilmoqda...</span>
                                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-tighter">Tasdiqlangach {expertFee} MALI yechiladi</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer ${isExpert ? 'bg-accent-primary' : 'bg-white/10'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextState = !isExpert;
                                    setIsExpert(nextState);
                                    if (nextState) setShowExpertModal(true);
                                    else {
                                        if (socket) socket.emit('update_profile', { is_expert: false });
                                    }
                                }}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isExpert ? 'left-[22px]' : 'left-1'}`} />
                            </div>
                        </div>
                        {isExpert && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <span className="text-white/30 text-[10px] uppercase font-bold block mb-1">Tajriba</span>
                                        <span className="text-white font-bold text-[14px]">{experience} yil</span>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <span className="text-white/30 text-[10px] uppercase font-bold block mb-1">Narx (soat)</span>
                                        <span className="text-white font-bold text-[14px]">{price} {currency}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 px-1">
                                    <span className="text-white/30 text-[10px] uppercase font-bold">Soha / Yo'nalish</span>
                                    <span className="text-white text-[13px] font-medium leading-tight">{profession || 'Tanlanmagan'} - {specializationDetails || '...'}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setShowExpertModal(true); }} className="w-full py-3 bg-accent-primary/10 text-[#00A884] text-[13px] font-bold rounded-xl hover:bg-accent-primary/20 transition-all border border-accent-primary/10">Profilni tahrirlash</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Shared Content Mockup */}
                <div className="px-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-white/40 text-[13px] font-bold uppercase tracking-wider">Shared Media</h4>
                        <span className="text-[#00A884] text-[12px] font-bold cursor-pointer hover:underline">See All</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/5 group cursor-pointer hover:bg-white/10 transition-all">
                                {i === 1 ? <ImageIcon className="h-5 w-5 text-white/20 group-hover:text-[#00A884]" /> :
                                    i === 2 ? <Film className="h-5 w-5 text-white/20 group-hover:text-pink-400" /> :
                                        i === 3 ? <FileText className="h-5 w-5 text-white/20 group-hover:text-yellow-400" /> :
                                            <MoreVertical className="h-5 w-5 text-white/20 group-hover:text-white" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderChatSettings = () => (
        <GlassCard
            className={`w-full h-full lg:h-auto lg:max-w-[420px] !p-0 border-none lg:border flex flex-col lg:max-h-[85vh] overflow-hidden rounded-none lg:!rounded-[25px] shadow-2xl animate-scale-up lg:border-white/10 text-white`}
            style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)` }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`flex items-center gap-4 p-4 px-6 border-b border-white/10`}>
                <button onClick={() => setCurrentView('main')} className={`text-white/40 hover:text-white transition-colors p-1`}><X className="h-6 w-6 rotate-90" /></button>
                <h2 className="font-medium text-[19px]">Настройки чатов</h2>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-8 pb-10">
                {/* PANEL AND BACKGROUND BLUR SLIDERS */}
                <div className="space-y-4">
                    <h4 className="text-accent-primary text-xs font-bold uppercase tracking-widest ml-1">Xiralashtirish sozlamalari</h4>
                    <div className="rounded-2xl p-5 space-y-6 border bg-white/5 border-white/10">
                        {/* Panel Blur Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-white">Panel Xiraligi (Blur)</span>
                                <span className="text-white/60">{bgSettings?.blur || 0}px</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="1"
                                value={bgSettings?.blur || 0}
                                onChange={(e) => onUpdateBgBlur?.(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1a1f2e] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none"
                            />
                        </div>

                        {/* Background Image Blur Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                <span className="text-white">Orqa Fon Xiraligi</span>
                                <span className="text-white/60">{bgSettings?.imageBlur || 0}px</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="1"
                                value={bgSettings?.imageBlur || 0}
                                onChange={(e) => onUpdateBgImageBlur?.(parseInt(e.target.value))}
                                className="w-full h-2 bg-[#1a1f2e] rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>



                {/* WALLPAPER SELECTOR */}
                <div className="space-y-4">
                    <h4 className="text-accent-primary text-xs font-bold uppercase tracking-widest ml-1">Fon rasmini o'zgartirish</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            "custom_upload",
                            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2000",
                            "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2000",
                            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000"
                        ].map((url, i) => (
                            <div key={i}
                                onClick={() => {
                                    if (url === 'custom_upload') {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => onUpdateBgImage?.(reader.result as string);
                                                reader.readAsDataURL(file);
                                            }
                                        };
                                        input.click();
                                    } else {
                                        onUpdateBgImage?.(url);
                                    }
                                }}
                                className={`aspect-video rounded-xl cursor-pointer border-2 transition-all hover:scale-105 active:scale-95 overflow-hidden flex flex-col items-center justify-center ${bgSettings?.image === url ? 'border-accent-primary shadow-lg shadow-accent-primary/20' : 'border-transparent bg-white/5'}`}>
                                {url === 'custom_upload' ? (
                                    <>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform bg-white/10">
                                            <Plus className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-white/40 group-hover:text-[#00A884]">Yuklash</span>
                                    </>
                                ) : (
                                    <div className="relative w-full h-full">
                                        <img src={url} className="w-full h-full object-cover" />
                                        {bgSettings?.image === url && (
                                            <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white shadow-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </GlassCard>
    );

    const renderWallet = () => (
        <GlassCard
            className={`w-full h-full lg:h-auto lg:max-w-[420px] !p-0 border-none lg:border flex flex-col lg:max-h-[85vh] overflow-hidden rounded-none lg:!rounded-[25px] shadow-2xl animate-scale-up lg:border-white/10 text-white`}
            style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)` }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`flex items-center gap-4 p-4 px-6 border-b border-white/10`}>
                <button onClick={() => setCurrentView('main')} className={`text-white/40 hover:text-white transition-colors p-1`}><X className="h-6 w-6 rotate-90" /></button>
                <h2 className="font-medium text-[19px]">Mening Hamyonim</h2>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6 pb-10">
                {/* Balance Cards */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex flex-col gap-1 text-center">
                        <span className="text-white/60 text-xs font-black uppercase tracking-widest">Mavjud Balans</span>
                        <div className="flex items-center justify-center gap-2">
                            <DollarSign className="h-8 w-8 text-white" />
                            <span className="text-white font-black text-4xl">{walletData.available} <span className="text-lg opacity-60">MALI</span></span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/5 rounded-xl text-yellow-500"><Lock className="h-5 w-5" /></div>
                        <div className="flex flex-col">
                            <span className="text-white font-bold">Kafillangan bandlovlar</span>
                            <span className="text-white/40 text-xs text-left">Darslar o'tilgunga qadar saqlanadi</span>
                        </div>
                    </div>
                    <div className="text-yellow-500 font-black">{walletData.locked} MALI</div>
                </div>

                {/* Subscription Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-accent-primary/20 rounded-xl text-[#00A884]"><Award className="h-5 w-5" /></div>
                        <div className="flex flex-col h-full items-start justify-center">
                            <span className="text-white font-bold leading-none">Mutaxassis Obunasi</span>
                            <span className="text-[#00A884] font-black text-xs uppercase tracking-widest leading-none mt-1">20 MALI / oy</span>
                        </div>
                    </div>

                    <p className="text-white/40 text-[11.5px] leading-relaxed pb-2">
                        Obuna - mutaxassislar ro'yxatida ko'rinish va mijozlardan to'lovlarni tizim ichida qabul qilish imkonini beradi.
                    </p>

                    <GlassButton
                        onClick={handleSubscribe}
                        disabled={isSubscribing || (!isExpert && walletData.available < 20)}
                        className={`w-full !rounded-xl py-3.5 font-bold transition-all ${isExpert && verifiedStatus !== 'none' ? '!bg-white/10 !text-white/40 cursor-not-allowed' : '!bg-emerald-600 !text-white'}`}
                    >
                        {isSubscribing ? 'Jarayonda...' : (isExpert && verifiedStatus !== 'none' ? 'Obuna Faol' : 'Obunani faollashtirish (20 MALI)')}
                    </GlassButton>
                </div>

            </div>
        </GlassCard>
    );

    const renderSettings = () => {
        const SETTINGS_ITEMS = [
            { id: 'account', icon: <User className="h-5 w-5" />, label: 'Мой аккаунт', subtext: "Ism va familiyani o'zgartirish" },
            { id: 'wallet', icon: <DollarSign className="h-5 w-5 text-emerald-400" />, label: 'Mening Hamyonim', subtext: "Balans, Escrow va Obuna" },
            { id: 'privacy', icon: <Lock className="h-5 w-5" />, label: 'Конфиденциальность' },
            { id: 'chats', icon: <MessageSquare className="h-5 w-5" />, label: 'Настройки чатов' },
            { id: 'folders', icon: <Folder className="h-5 w-5" />, label: 'Папки с чатами' },
            { id: 'advanced', icon: <Sliders className="h-5 w-5" />, label: 'Продвинутые настройки' },
            { id: 'call', icon: <Volume2 className="h-5 w-5" />, label: 'Звук и камера' },
            { id: 'battery', icon: <Zap className="h-5 w-5" />, label: 'Заряд батареи и анимация' },
            ...(user.role === 'admin' ? [{ id: 'admin', icon: <Shield className="h-5 w-5 text-emerald-400" />, label: 'Admin Panel', subtext: "Ekspertlarni boshqarish" }] : []),
        ];

        return (
            <GlassCard
                className={`w-full h-full lg:h-auto lg:max-w-[420px] !p-0 border-none lg:border flex flex-col lg:max-h-[85vh] overflow-hidden rounded-none lg:!rounded-[25px] shadow-2xl animate-scale-up lg:border-white/10 text-white`}
                style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)` }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Header Aliased as "Настройки" */}
                <div className={`flex items-center justify-between p-4 px-6 border-b border-white/10`}>
                    <h2 className="font-medium text-[19px]">Настройки</h2>
                    <div className={`flex items-center gap-5 text-white/50`}>
                        <button onClick={() => setShowLanguageModal(true)} className="hover:text-white transition-colors flex items-center gap-1.5 uppercase font-bold text-[13px] bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                            <Languages className="h-[18px] w-[18px]" /> {language}
                        </button>
                        <button className="hover:text-white transition-colors"><Search className="h-[22px] w-[22px]" /></button>
                        <button className="hover:text-white transition-colors"><MoreVertical className="h-[22px] w-[22px]" /></button>
                        <button onClick={onClose} className="hover:text-white transition-colors"><X className="h-[22px] w-[22px]" /></button>
                    </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 pb-6">
                    {/* User Profile Section (Row style from screenshot) */}
                    <div className="px-6 py-5 flex items-center gap-5 group cursor-pointer hover:bg-white/5 transition-all"
                        onClick={() => { setEditFirstName(user.name || ""); setEditLastName(user.surname || ""); setShowNameModal(true); }}>
                        <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-white/10 shadow-xl relative">
                            <img
                                src={getAvatarUrl(user.avatar || user.avatar_url) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"}
                                alt="Avatar"
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-[18px] leading-tight group-hover:text-[#00A884] transition-colors">{user.name} {user.surname || ''}</h3>
                            <div className="flex flex-col mt-0.5 opacity-40">
                                <span className="text-[13px]">{user.phone || '+998 95 020 36 01'}</span>
                                <span className="text-[13px]">@{user.username || 'username'}</span>
                            </div>
                        </div>
                        <button className="text-white/20 group-hover:text-white transition-all bg-white/5 p-2 rounded-xl active:scale-95"><Grid className="h-6 w-6" /></button>
                    </div>

                    <div className="h-[1px] bg-white/5 mx-6 mb-2"></div>

                    {/* Settings List */}
                    <div className="space-y-0.5 mt-2">
                        {SETTINGS_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                className="w-full flex items-center gap-5 px-6 py-3.5 hover:bg-white/5 transition-all group text-left"
                                onClick={() => {
                                    if (item.id === 'account') { setEditFirstName(user.name || ""); setEditLastName(user.surname || ""); setShowNameModal(true); }
                                    else if (item.id === 'wallet') {
                                        setCurrentView('wallet');
                                        fetchWallet();
                                    }
                                    else if (item.id === 'chats') { setCurrentView('chat_settings'); }
                                    else if (item.id === 'admin') { window.open('/AdminZero0723s', '_blank'); }
                                }}
                            >
                                <span className="text-white/30 group-hover:text-[#00A884] transition-colors">{item.icon}</span>
                                <div className="flex-1 flex flex-col justify-center">
                                    <span className="text-white/90 group-hover:text-white text-[15px] font-medium">{item.label}</span>
                                    {item.subtext && <span className="text-white/20 text-[12px] mt-0.5">{item.subtext}</span>}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="px-6 mt-8">
                        <button onClick={onLogout} className="w-full py-4 text-red-500/80 font-bold text-[15px] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all border border-red-500/5">Log Out</button>
                    </div>
                </div>
            </GlassCard>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center lg:p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            {currentView === 'chat_settings' ? renderChatSettings() :
                currentView === 'wallet' ? renderWallet() :
                    (mode === 'profile' ? renderProfile() : renderSettings())}

            {/* SHARED MODALS */}
            {showLanguageModal && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setShowLanguageModal(false); }}>
                    <GlassCard
                        className="w-full max-w-[300px] !bg-transparent p-4 rounded-[28px] border border-white/10 overflow-hidden shadow-2xl"
                        style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)` }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-white font-bold p-3 text-lg mb-2">Tilni tanlang / Язык</h3>
                        <div className="space-y-1">
                            {[{ id: 'uz', n: 'O\'zbekcha' }, { id: 'ru', n: 'Русский' }, { id: 'en', n: 'English' }].map(l => (
                                <button key={l.id}
                                    onClick={() => handleSaveLanguage(l.id as any)}
                                    className={`w - full flex items - center justify - between p - 4 rounded - xl transition - all ${language === l.id ? 'bg-accent-primary text-white font-bold' : 'text-white/60 hover:bg-white/5'} `}>
                                    <span>{l.n}</span>
                                    {language === l.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                </button>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            )}
            {showNameModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4" onClick={(e) => { e.stopPropagation(); setShowNameModal(false); }}>
                    <GlassCard
                        className="w-full max-w-[340px] !bg-transparent p-7 shadow-2xl animate-scale-in rounded-[28px] border border-white/10"
                        style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-white font-bold text-xl mb-6">Profilni tahrirlash</h3>
                        <div className="space-y-5">
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Ism</label>
                                <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                                <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Familiya</label>
                                <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none transition-all" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-10">
                            <GlassButton onClick={handleSaveName} className="w-full !bg-accent-primary !text-white !rounded-xl py-3.5 font-bold shadow-lg shadow-accent-primary/20">Saqlash</GlassButton>
                            <button onClick={() => setShowNameModal(false)} className="w-full py-3 text-white/30 hover:text-white transition-colors text-[14px]">Bekor qilish</button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {showUsernameModal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4" onClick={(e) => { e.stopPropagation(); setShowUsernameModal(false); }}>
                    <GlassCard
                        className="w-full max-w-[340px] !bg-transparent p-7 shadow-2xl animate-scale-in rounded-[28px] border border-white/10"
                        style={{ backgroundColor: `rgba(${bgSettings?.rgb?.r || 28}, ${bgSettings?.rgb?.g || 36}, ${bgSettings?.rgb?.b || 47}, 0.8)` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-white font-bold text-xl mb-4">Username</h3>
                        <div className="relative group">
                            <span className="absolute left-4 top-[15px] text-accent-primary font-bold text-lg group-focus-within:scale-110 transition-transform">@</span>
                            <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-9 pr-4 text-white focus:border-accent-primary focus:outline-none transition-all text-lg" placeholder="username" />
                        </div>
                        <p className="text-white/20 text-[12px] mt-4 leading-relaxed">Sizni @usernamer orqali messenjerda hamma topishi mumkin. Minimal 5 ta belgi.</p>
                        <div className="flex flex-col gap-3 mt-10">
                            <GlassButton onClick={handleSaveUsername} className="w-full !bg-accent-primary !text-white !rounded-xl py-3.5 font-bold">Saqlash</GlassButton>
                            <button onClick={() => setShowUsernameModal(false)} className="w-full py-3 text-white/30 hover:text-white transition-colors">Bekor qilish</button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {showExpertModal && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center bg-gradient-to-br from-[#020817]/90 via-[#001f1a]/90 to-[#020817]/90 backdrop-blur-xl px-4 animate-fade-in" onClick={(e) => { e.stopPropagation(); setShowExpertModal(false); }}>
                    <GlassCard
                        className="w-full max-w-[500px] max-h-[90vh] !bg-gradient-to-br from-[#022c22] via-[#020617] to-[#022c22] p-8 rounded-[32px] shadow-2xl border border-emerald-500/20 flex flex-col"
                        style={{ backgroundColor: 'rgba(4, 47, 46, 0.92)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8 flex-shrink-0">
                            <h3 className="text-white font-bold text-2xl flex items-center gap-3">
                                <Award className="h-8 w-8 text-[#00A884]" />
                                Mutaxassis Profili
                            </h3>
                            <button onClick={() => setShowExpertModal(false)} className="text-white/30 hover:text-white transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {(verifiedStatus === 'pending' || verifiedStatus === 'approved') && (
                            <div className={`mb-6 p-4 rounded-2xl flex flex-col gap-3 ${verifiedStatus === 'pending' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                                <div className="flex items-center gap-3">
                                    {verifiedStatus === 'pending' ? <Clock className="h-6 w-6 text-yellow-500" /> : <CheckCircle className="h-6 w-6 text-emerald-500" />}
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-sm uppercase tracking-wider ${verifiedStatus === 'pending' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                            {verifiedStatus === 'pending' ? 'Admin tasdiqlashini kuting' : 'Tasdiqlangan'}
                                        </span>
                                        <span className="text-white/60 text-xs mt-0.5">
                                            {verifiedStatus === 'pending' ? 'Ma\'lumotlaringiz admin tomonidan tekshirilmoqda. Formadagi ma\'lumotlar saqlandi.' : 'Sizning ekspert profilingiz muvaffaqiyatli tasdiqlandi!'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[9px] text-white/60">
                                    {[
                                        { id: 'sent', label: "Yuborildi" },
                                        { id: 'review', label: "Admin tekshiradi" },
                                        { id: 'done', label: "Tasdiqlandi" }
                                    ].map((step, index) => {
                                        const isActive =
                                            verifiedStatus === 'pending'
                                                ? index <= 1
                                                : verifiedStatus === 'approved'
                                                    ? index <= 2
                                                    : index === 0;
                                        return (
                                            <div key={step.id} className="flex-1 flex items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${isActive ? 'bg-emerald-400' : 'bg-white/20'}`} />
                                                <span className={`${isActive ? 'text-emerald-100' : 'text-white/30'}`}>{step.label}</span>
                                                {index < 2 && (
                                                    <div className={`flex-1 h-px ml-2 ${isActive ? 'bg-emerald-400/60' : 'bg-white/10'}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-8 pb-6">
                            {/* SECTION 1: BASIC INFO */}
                            <div className="space-y-4">
                                <h4 className="text-[#00A884] font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2">Asosiy ma'lumotlar</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Kasb turi</label>
                                        <select
                                            ref={professionRef}
                                            value={profession}
                                            onChange={(e) => setProfession(e.target.value)}
                                            className={`w-full bg-black/40 backdrop-blur-md shadow-inner rounded-xl py-3.5 px-4 text-white focus:outline-none appearance-none border ${
                                                expertErrors.profession ? 'border-red-500/70' : 'border-white/10 focus:border-accent-primary'
                                            }`}
                                        >
                                            <option value="" className="bg-[#121B22]">Tanlang...</option>
                                            <optgroup label="Ta'lim va Mentorlik" className="bg-[#121B22] text-emerald-400 font-bold">
                                                <option value="O'qituvchi">O'qituvchi (Mentor)</option>
                                                <option value="Mentor">Mentor (Biznes/Shaxsiy)</option>
                                                <option value="Startap mentori">Startap mentori</option>
                                                <option value="Dasturchi mentor">Dasturchi mentor</option>
                                            </optgroup>
                                            <optgroup label="Huquq sohasi" className="bg-[#121B22] text-[#00A884] font-bold">
                                                <option value="Advokat">Advokat</option>
                                                <option value="Yurist">Yurist</option>
                                                <option value="Notarius maslahatchi">Notarius maslahatchi</option>
                                                <option value="Soliq maslahatchisi">Soliq maslahatchisi</option>
                                                <option value="Mehnat huquqi eksperti">Mehnat huquqi eksperti</option>
                                                <option value="Migratsiya maslahatchisi">Migratsiya maslahatchisi</option>
                                            </optgroup>
                                            <optgroup label="Psixologiya" className="bg-[#121B22] text-[#00A884] font-bold">
                                                <option value="Klinik psixolog">Klinik psixolog</option>
                                                <option value="Oila psixologi">Oila psixologi</option>
                                                <option value="Bolalar psixologi">Bolalar psixologi</option>
                                                <option value="Psixoterapevt">Psixoterapevt</option>
                                                <option value="Stress / depressiya mutaxassisi">Stress / depressiya mutaxassisi</option>
                                                <option value="Career coach">Career coach</option>
                                            </optgroup>
                                            <optgroup label="Biznes va moliya" className="bg-[#121B22] text-[#00A884] font-bold">
                                                <option value="Biznes konsultant">Biznes konsultant</option>
                                                <option value="Startap mentori">Startap mentori</option>
                                                <option value="Marketing strateg">Marketing strateg</option>
                                                <option value="SMM mutaxassis">SMM mutaxassis</option>
                                                <option value="Moliyaviy maslahatchi">Moliyaviy maslahatchi</option>
                                                <option value="Investitsiya eksperti">Investitsiya eksperti</option>
                                            </optgroup>
                                            <optgroup label="Tibbiyot" className="bg-[#121B22] text-[#00A884] font-bold">
                                                <option value="Umumiy shifokor">Umumiy shifokor (online)</option>
                                                <option value="Dietolog">Dietolog</option>
                                                <option value="Endokrinolog">Endokrinolog</option>
                                                <option value="Dermatolog">Dermatolog</option>
                                                <option value="Sport shifokori">Sport shifokori</option>
                                            </optgroup>
                                            <optgroup label="IT va texnologiya" className="bg-[#121B22] text-[#00A884] font-bold">
                                                <option value="Dasturchi mentor">Dasturchi mentor</option>
                                                <option value="UX/UI maslahatchi">UX/UI maslahatchi</option>
                                                <option value="DevOps konsultant">DevOps konsultant</option>
                                                <option value="Kiberxavfsizlik eksperti">Kiberxavfsizlik eksperti</option>
                                                <option value="AI bo‘yicha konsultant">AI bo‘yicha konsultant</option>
                                            </optgroup>
                                            <option value="Other" className="bg-[#121B22]">Boshqa</option>
                                        </select>
                                        {expertErrors.profession && (
                                            <p className="text-[10px] text-red-400 mt-1 ml-1">{expertErrors.profession}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Mutaxassislik yo'nalishi</label>
                                        <input value={specializationDetails} onChange={(e) => setSpecializationDetails(e.target.value)} placeholder="Masalan: Klinik psixologiya, Oila va nikoh..." className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Ish tajribasi (yil)</label>
                                            <input
                                                ref={experienceRef}
                                                type="number"
                                                value={experience || 0}
                                                onChange={(e) => setExperience(parseInt(e.target.value) || 0)}
                                                className={`w-full bg-black/40 backdrop-blur-md shadow-inner rounded-xl py-3.5 px-4 text-white focus:outline-none border ${
                                                    expertErrors.experience ? 'border-red-500/70' : 'border-white/10 focus:border-accent-primary'
                                                }`}
                                            />
                                            {expertErrors.experience && (
                                                <p className="text-[10px] text-red-400 mt-1 ml-1">{expertErrors.experience}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Diplom bormi?</label>
                                            <div className="flex gap-2">
                                                <button onClick={() => setHasDiploma(true)} className={`flex-1 py-3.5 rounded-xl border transition-all font-bold text-xs ${hasDiploma ? 'bg-accent-primary border-accent-primary text-white' : 'bg-black/40 backdrop-blur-md shadow-inner border-white/10 text-white/40'}`}>HA</button>
                                                <button onClick={() => setHasDiploma(false)} className={`flex-1 py-3.5 rounded-xl border transition-all font-bold text-xs ${!hasDiploma ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-black/40 backdrop-blur-md shadow-inner border-white/10 text-white/40'}`}>YO'Q</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: EDUCATION & WORK */}
                            <div className="space-y-4">
                                <h4 className="text-[#00A884] font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2">Ta'lim va Ish joyi</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Ta'lim muassasasi nomi</label>
                                        <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Masalan: TATU, O'zMU..." className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Ish joyi (hozirgi)</label>
                                        <input value={currentWorkplace} onChange={(e) => setCurrentWorkplace(e.target.value)} placeholder="Kompaniya yoki muassasa nomi" className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: DOCUMENTS */}
                            <div className="space-y-4">
                                <h4 className="text-[#00A884] font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2">Hujjatlar (majburiy)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Selfie (majburiy)', key: 'selfie', icon: <Camera className="h-5 w-5" />, ref: selfieRef, url: selfieUrl, accept: 'image/*', error: expertErrors.selfie },
                                        { label: 'Rezyume (PDF, majburiy)', key: 'resume', icon: <FileText className="h-5 w-5 text-indigo-400" />, ref: resumeRef, url: resumeUrl, accept: '.pdf', error: expertErrors.resume },
                                        { label: 'Anketa (majburiy)', key: 'anketa', icon: <FileText className="h-5 w-5 text-amber-400" />, ref: anketaRef, url: anketaUrl, accept: '.pdf,.doc,.docx,image/*', error: expertErrors.anketa }
                                    ].map((doc) => (
                                        <div key={doc.key} className="relative group">
                                            <button
                                                onClick={() => doc.ref.current?.click()}
                                                className={`w-full flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed transition-all ${
                                                    doc.error
                                                        ? 'bg-red-500/5 border-red-500/60'
                                                        : doc.url
                                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                                            : 'bg-white/5 border-white/10 hover:border-accent-primary/50 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className={`p-3 rounded-full mb-2 transition-colors ${
                                                    doc.error
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : doc.url
                                                            ? 'bg-emerald-500/20 text-emerald-400'
                                                            : 'bg-white/5 text-white/30 group-hover:text-[#00A884]'
                                                }`}>{doc.icon}</div>
                                                <span className={`text-[10px] uppercase font-bold ${
                                                    doc.error
                                                        ? 'text-red-400'
                                                        : doc.url
                                                            ? 'text-emerald-400'
                                                            : 'text-white/40'
                                                }`}>
                                                    {doc.url ? 'Yuklangan' : doc.label}
                                                </span>
                                            </button>
                                            <input
                                                type="file"
                                                ref={doc.ref as any}
                                                className="hidden"
                                                accept={doc.accept}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleDocumentUpload(doc.key, file);
                                                }}
                                            />
                                            {doc.error && (
                                                <p className="text-[9px] text-red-400 mt-1 text-center">{doc.error}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION 4: PRICING & FORMAT */}
                            <div className="space-y-4">
                                <h4 className="text-[#00A884] font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2">Xizmat va Narxlar</h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">1 soatlik narx</label>
                                            <input
                                                ref={priceRef}
                                                type="number"
                                                value={price || 0}
                                                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                                                className={`w-full bg-black/40 backdrop-blur-md shadow-inner rounded-xl py-3.5 px-4 text-white focus:outline-none border ${
                                                    expertErrors.price ? 'border-red-500/70' : 'border-white/10 focus:border-accent-primary'
                                                }`}
                                            />
                                            {expertErrors.price && (
                                                <p className="text-[10px] text-red-400 mt-1 ml-1">{expertErrors.price}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Valyuta</label>
                                            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none appearance-none">
                                                <option value="MALI" className="bg-[#121B22]">MALI</option>
                                                <option value="UZS" className="bg-[#121B22]">UZS</option>
                                                <option value="USD" className="bg-[#121B22]">USD</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Xizmat ko'rsatish tili</label>
                                        <input
                                            value={serviceLanguages}
                                            onChange={(e) => setServiceLanguages(e.target.value)}
                                            placeholder="Masalan: O'zbek, Rus, Ingliz"
                                            className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Xizmat turi</label>
                                        <div className="flex gap-2">
                                            {[
                                                { key: 'online', label: "Onlayn" },
                                                { key: 'offline', label: "Oflayn" }
                                            ].map((fmt) => (
                                                <button
                                                    key={fmt.key}
                                                    onClick={() => setServiceFormat(fmt.key)}
                                                    className={`flex-1 py-3 rounded-lg border transition-all text-[11px] font-bold ${
                                                        serviceFormat === fmt.key
                                                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                                                            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/70 hover:bg-emerald-500/15'
                                                    }`}
                                                >
                                                    {fmt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4.5: GROUPS (FOR MENTORS) */}
                            {isMentorProfession(profession) && (
                                <div className="space-y-4">
                                    <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2">Guruhlar (Majburiy)</h4>
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Guruh nomi..." className="flex-1 bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent-primary outline-none" />
                                            <input type="time" value={newGroupTime} onChange={(e) => setNewGroupTime(e.target.value)} className="w-24 bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-xl px-2 py-3 text-sm text-white focus:border-accent-primary outline-none" />
                                            <button
                                                onClick={() => {
                                                    if (newGroupName) {
                                                        setExpertGroups([...expertGroups, { id: Date.now().toString(), name: newGroupName, time: newGroupTime }]);
                                                        setNewGroupName("");
                                                    }
                                                }}
                                                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white px-4 rounded-xl transition-all"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {expertGroups.map((g) => (
                                                <div key={g.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white">{g.name}</span>
                                                        <span className="text-[10px] text-white/40">{g.time}</span>
                                                    </div>
                                                    <button onClick={() => setExpertGroups(expertGroups.filter(x => x.id !== g.id))} className="text-red-400/50 hover:text-red-400 p-1">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {expertGroups.length === 0 && (
                                                <div className="text-center py-4 text-xs text-white/20 italic border border-dashed border-white/5 rounded-xl">
                                                    Kamida bitta guruh qo'shing
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 5: BIO & DESC */}
                            <div className="space-y-4">
                                <h4 className="text-[#00A884] font-bold text-xs uppercase tracking-widest border-b border-white/5 pb-2">Batafsil ma'lumot</h4>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">O'zi haqida (Bio)</label>
                                        <textarea value={bioExpert} onChange={(e) => setBioExpert(e.target.value)} placeholder="Qisqacha o'zingiz haqingizda..." className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none min-h-[100px] resize-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-white/40 text-[11px] ml-1 uppercase font-bold tracking-wider">Mutaxassislik tavsifi</label>
                                        <textarea value={specialtyDesc} onChange={(e) => setSpecialtyDesc(e.target.value)} placeholder="Yutuqlaringiz va tajribangiz haqida batafsil..." className="w-full bg-black/40 backdrop-blur-md shadow-inner border border-white/10 rounded-2xl py-3.5 px-4 text-white focus:border-accent-primary focus:outline-none min-h-[120px] resize-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 mt-2 flex flex-col gap-2 flex-shrink-0">
                            <div className="px-2 py-1.5 rounded-lg flex items-start gap-2 mb-1 animate-in slide-in-from-bottom duration-300">
                                <div className="p-1 bg-amber-500/20 rounded-lg text-amber-400 flex-shrink-0">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-bold text-amber-400 uppercase tracking-[0.18em] mb-0.5">
                                        Muhim ma&apos;lumot
                                    </p>
                                    <p className="text-[10px] text-white/75 leading-snug">
                                        Profilingiz admin tomonidan tasdiqlangach, hisobingizdan{" "}
                                        <span className="text-amber-300 font-semibold">{expertFee} MALI</span> avtomatik yechiladi.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between gap-2">
                                <button
                                    onClick={() => setShowExpertModal(false)}
                                    className="w-full sm:w-auto sm:flex-1 py-2 text-[12px] text-white/60 hover:text-white transition-colors text-left"
                                >
                                    Bekor qilish
                                </button>
                                <GlassButton
                                    onClick={handleSaveExpertData}
                                    className="w-auto px-5 !bg-emerald-500 hover:!bg-emerald-400 !text-white !rounded-full py-2 text-xs font-semibold shadow-lg shadow-emerald-500/40 ml-auto"
                                >
                                    Yuborish
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard >
                </div >
            )}
            {
                showDatePicker && (
                    <GlassDatePicker
                        value={birthday}
                        language={language === 'ru' ? 'ru' : 'uz'}
                        onChange={(val) => {
                            handleSaveBirthday(val);
                            setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                    />
                )
            }

            {toast && (
                <div
                    className={`
                        fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm
                        ${toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100' :
                            toast.type === 'warning' ? 'bg-amber-500/15 border-amber-500/40 text-amber-100' :
                                'bg-red-500/15 border-red-500/40 text-red-100'}
                    `}
                >
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                        {toast.type === 'warning' && <Bell className="w-4 h-4 flex-shrink-0" />}
                        {toast.type === 'error' && <X className="w-4 h-4 flex-shrink-0" />}
                        <span className="leading-snug">{toast.message}</span>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-2 text-white/60 hover:text-white flex-shrink-0"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}

