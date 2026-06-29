'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Send, 
  AlertTriangle, 
  Building2, 
  RefreshCw, 
  Search, 
  Clock,
  ExternalLink,
  CheckCircle,
  FileText,
  Mail
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({
    companies: [],
    jobs: [],
    outreachLogs: [],
    lastSyncedAt: null
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'logs'

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        // Only use mock data if there is a genuine API error - never when data is just empty
        if (json.error) {
          useMockData();
        } else {
          setData({
            companies: json.companies || [],
            jobs: json.jobs || [],
            outreachLogs: json.outreachLogs || [],
            lastSyncedAt: json.lastSyncedAt || null
          });
        }
      } else {
        useMockData();
      }
    } catch (err) {
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  const useMockData = () => {
    setData({
      companies: [
        { id: 1, name: 'Novexis Tech', domain: 'novexistech.com' },
        { id: 2, name: 'AdCubes', domain: 'adcubes.com' },
        { id: 3, name: 'EPAM Systems', domain: 'epam.com' }
      ],
      jobs: [
        { id: 1, companyName: 'Novexis Tech', title: 'Senior Node.js Developer', platform: 'LinkedIn', status: 'Iletisim Kuruldu', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, companyName: 'AdCubes', title: 'Full Stack / AI Engineer', platform: 'LinkedIn', status: 'Iletisim Kuruldu', created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 3, companyName: 'EPAM Systems', title: 'Senior SAP CAP Node.js Developer', platform: 'LinkedIn', status: 'Manuel İnceleme Bekliyor', created_at: new Date(Date.now() - 10800000).toISOString() },
        { id: 4, companyName: 'Hopi', title: 'Senior Full-Stack Engineer', platform: 'LinkedIn', status: 'Manuel İnceleme Bekliyor', created_at: new Date(Date.now() - 14400000).toISOString() }
      ],
      outreachLogs: [
        { id: 1, companyName: 'Novexis Tech', jobTitle: 'Senior Node.js Developer', email_sent_to: 'info@novexistech.com', sent_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, companyName: 'AdCubes', jobTitle: 'Full Stack / AI Engineer', email_sent_to: 'info@adcubes.com', sent_at: new Date(Date.now() - 7200000).toISOString() }
      ],
      lastSyncedAt: new Date().toISOString()
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic
  const filteredJobs = (data.jobs || []).filter(job => {
    const title = job.title || '';
    const companyName = job.companyName || '';
    const matchesSearch = (title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = (data.outreachLogs || []).filter(log => {
    const jobTitle = log.jobTitle || '';
    const companyName = log.companyName || '';
    const emailSentTo = log.email_sent_to || '';
    return (jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
            companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            emailSentTo.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Metric computations
  const totalJobs = (data.jobs || []).length;
  const sentOutreachCount = (data.outreachLogs || []).length;
  const pendingManualCount = (data.jobs || []).filter(j => j && j.status === 'Manuel İnceleme Bekliyor').length;
  const totalCompanies = (data.companies || []).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Novexis Outreach Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              B2B Hot-Lead Outreach Engine Canlı Durum ve İlan İzleyici
            </p>
          </div>
          <div className="flex items-center gap-4">
            {data.lastSyncedAt && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Son Senkronizasyon: {new Date(data.lastSyncedAt).toLocaleTimeString()}
              </div>
            )}
            <button 
              onClick={fetchData} 
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl transition duration-200 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </header>

        {/* Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl flex items-center gap-5 transition hover:border-slate-700/80">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Toplam İlan</p>
              <h3 className="text-3xl font-bold mt-1 text-blue-100">{totalJobs}</h3>
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl flex items-center gap-5 transition hover:border-slate-700/80">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gönderilen Outreach</p>
              <h3 className="text-3xl font-bold mt-1 text-indigo-100">{sentOutreachCount}</h3>
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl flex items-center gap-5 transition hover:border-slate-700/80">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Manuel İnceleme</p>
              <h3 className="text-3xl font-bold mt-1 text-amber-100">{pendingManualCount}</h3>
            </div>
          </div>

          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl flex items-center gap-5 transition hover:border-slate-700/80">
            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Kayıtlı Şirket</p>
              <h3 className="text-3xl font-bold mt-1 text-violet-100">{totalCompanies}</h3>
            </div>
          </div>

        </section>

        {/* Control Center & Tables */}
        <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden">
          
          {/* Tabs & Filters */}
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/20">
            <div className="flex gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
              <button 
                onClick={() => setActiveTab('jobs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'jobs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileText className="w-4 h-4" />
                İlan Havuzu ({filteredJobs.length})
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Mail className="w-4 h-4" />
                Gönderim Geçmişi ({filteredLogs.length})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Ara (Firma, ilan...)" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                />
              </div>

              {/* Status Filter for Jobs tab */}
              {activeTab === 'jobs' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">Tüm Durumlar</option>
                  <option value="Yeni">Yeni</option>
                  <option value="Iletisim Kuruldu">İletişim Kuruldu</option>
                  <option value="Manuel İnceleme Bekliyor">Manuel İnceleme</option>
                </select>
              )}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {activeTab === 'jobs' ? (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Firma & İlan</th>
                    <th className="px-6 py-4">Platform</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4 text-right">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        Kayıtlı ilan bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-800/10">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-100">{job.companyName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{job.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-850 px-2.5 py-1 rounded-md text-xs border border-slate-750 font-medium">
                            {job.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                            job.status === 'Yeni' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            job.status === 'Iletisim Kuruldu' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {job.url && (
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                              İlan
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Şirket & Görev</th>
                    <th className="px-6 py-4">Gönderilen E-Posta</th>
                    <th className="px-6 py-4">Gönderim Tarihi</th>
                    <th className="px-6 py-4 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        Gönderilen mail kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/10">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-100">{log.companyName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{log.jobTitle}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-300">
                          {log.email_sent_to}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Gönderildi
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
}
