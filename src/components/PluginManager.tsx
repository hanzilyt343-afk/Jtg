import React, { useEffect, useState } from "react"; 
import { LoadingOverlay } from "../components/LoadingOverlay";
import axios from "axios";
import { Search, Download, RefreshCw, Puzzle, AlertCircle, Box, Server, Cpu, Star, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Plugin {
  id: string;
  source: 'modrinth' | 'spigot' | 'hangar';
  name: string;
  tag: string;
  downloads: number;
  rating: number;
  icon: string | null;
}

export default function PluginManager({ serverId }: { serverId: string }) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState<'all' | 'modrinth' | 'spigot' | 'hangar'>('all');

  const searchPlugins = async (searchQuery: string = "essentials") => {
    try {
      setLoading(true);
      
      const q = searchQuery.trim() || 'essentials';
      const results: Plugin[] = [];
      const promises = [];
      
      const externalAxios = axios.create();
      delete externalAxios.defaults.headers.common['Authorization'];
      
      if (activeSource === 'all' || activeSource === 'modrinth') {
        promises.push(
          externalAxios.get(`https://api.modrinth.com/v2/search?query=${q}&facets=[["project_type:plugin"]]&limit=15`)
            .then(res => {
              res.data.hits.forEach((hit: any) => {
                results.push({
                  id: hit.project_id,
                  source: 'modrinth',
                  name: hit.title,
                  tag: hit.description,
                  downloads: hit.downloads,
                  rating: 0,
                  icon: hit.icon_url
                });
              });
            }).catch(() => {})
        );
      }
      
      if (activeSource === 'all' || activeSource === 'spigot') {
        promises.push(
          externalAxios.get(`https://api.spiget.org/v2/search/resources/${q}?field=name&size=15&page=1`)
            .then(res => {
              if(Array.isArray(res.data)) {
                res.data.forEach((hit: any) => {
                  results.push({
                    id: hit.id.toString(),
                    source: 'spigot',
                    name: hit.name,
                    tag: hit.tag,
                    downloads: hit.downloads,
                    rating: hit.rating ? hit.rating.average : 0,
                    icon: hit.icon?.url ? `https://spigotmc.org/${hit.icon.url}` : null
                  });
                });
              }
            }).catch(() => {})
        );
      }

      if (activeSource === 'all' || activeSource === 'hangar') {
        promises.push(
          externalAxios.get(`https://hangar.papermc.io/api/v1/projects?q=${q}&limit=15`)
            .then(res => {
              if (res.data && res.data.result) {
                res.data.result.forEach((hit: any) => {
                  results.push({
                    id: `${hit.namespace.owner}/${hit.namespace.slug}`,
                    source: 'hangar',
                    name: hit.name,
                    tag: hit.description,
                    downloads: hit.stats?.downloads || 0,
                    rating: 0,
                    icon: null
                  });
                });
              }
            }).catch(() => {})
        );
      }

      await Promise.all(promises);
      results.sort((a, b) => b.downloads - a.downloads);
      setPlugins(results);
    } catch (e) {
      console.error(e);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPlugins();
  }, [activeSource]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlugins(query);
  };

  const handleInstall = async (plugin: Plugin) => {
    if (!confirm(`Are you sure you want to install ${plugin.name}?`)) return;
    try {
      setIsInstalling(plugin.id);
      
      const res = await axios.post(`/api/servers/${serverId}/plugins/install`, {
        source: plugin.source,
        pluginId: plugin.id,
        pluginName: plugin.name
      });
      
      alert(res.data.message || `${plugin.name} installed successfully! Restart the server to apply changes.`);
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to install plugin.");
    } finally {
      setIsInstalling(null);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'modrinth': return <Box className="w-3.5 h-3.5 text-emerald-400" />;
      case 'spigot': return <Server className="w-3.5 h-3.5 text-amber-400" />;
      case 'hangar': return <Cpu className="w-3.5 h-3.5 text-sky-400" />;
      default: return <Puzzle className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case 'modrinth': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'spigot': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hangar': return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'modrinth': return 'Modrinth';
      case 'spigot': return 'SpigotMC';
      case 'hangar': return 'Hangar';
      default: return source;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 text-gray-100 bg-transparent">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-2xl p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Puzzle className="w-7 h-7 text-sky-400" /> Plugin Marketplace
            </h2>
            <p className="text-xs font-semibold text-gray-400 mt-1">
              Search and auto-install plugins directly from Modrinth, SpigotMC, and Paper Hangar.
            </p>
          </div>
        </div>

        {/* Search & Filter Container */}
        <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 md:p-6 border-b border-white/10 space-y-4">
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plugins by name or keyword..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-2xl text-xs md:text-sm font-bold transition-all shadow-lg shadow-sky-500/20 whitespace-nowrap shrink-0"
              >
                Search Repository
              </button>
            </form>
            
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {(['all', 'modrinth', 'spigot', 'hangar'] as const).map(src => {
                const isActive = activeSource === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveSource(src)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                      isActive 
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 shadow-md shadow-sky-500/10' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {src === 'all' ? <Puzzle className="w-3.5 h-3.5" /> : getSourceIcon(src)}
                    {src === 'all' ? 'All Sources' : getSourceName(src)}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Plugin Items List */}
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                <span className="text-xs font-mono tracking-wider uppercase text-gray-500">Searching Repositories...</span>
              </div>
            ) : plugins.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                <AlertCircle className="w-10 h-10 mb-3 text-gray-600" />
                <p className="text-sm font-medium">No plugins found matching your search.</p>
              </div>
            ) : (
              plugins.map((plugin) => (
                <div 
                  key={`${plugin.source}-${plugin.id}`} 
                  className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/10 shadow-inner">
                      {plugin.icon ? (
                         <img src={plugin.icon} alt={plugin.name} className="w-full h-full object-cover" />
                      ) : (
                         <Puzzle className="w-6 h-6 text-gray-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                         <h4 className="font-bold text-gray-100 text-sm md:text-base truncate">{plugin.name}</h4>
                         <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider flex items-center gap-1.5 ${getSourceBadgeStyle(plugin.source)}`}>
                            {getSourceIcon(plugin.source)} {getSourceName(plugin.source)}
                         </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">{plugin.tag}</p>
                      
                      <div className="flex items-center gap-4 mt-2.5 text-[11px] text-gray-400 font-mono">
                        {plugin.downloads > 0 && (
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5" title="Downloads">
                            <Download className="w-3 h-3 text-sky-400" />
                            {plugin.downloads.toLocaleString()}
                          </span>
                        )}
                        {plugin.rating > 0 && (
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 text-amber-400" title="Rating">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {plugin.rating.toFixed(1)} / 5
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleInstall(plugin)}
                    disabled={isInstalling !== null}
                    className="w-full md:w-auto px-5 py-2.5 bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-gray-200 hover:text-sky-300 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    {isInstalling === plugin.id ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin text-sky-400" /> Installing...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2 text-sky-400" /> Install Plugin</>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {isInstalling !== null && <LoadingOverlay message="Installing plugin..." />}
    </div>
  );
              }
                      
