import React, { useEffect, useState } from "react"; 
import { LoadingOverlay } from "../components/LoadingOverlay";
import axios from "axios";
import { 
  Folder, FileText, ArrowLeft, Upload, Trash2, Edit2, Save, 
  Archive, Search, X, CheckSquare, Square, Download, ChevronRight, FileCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FileManager({ serverId }: { serverId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [path, setPath] = useState("/");
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isUnzipping, setIsUnzipping] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`/api/servers/${serverId}/files?path=${encodeURIComponent(path)}`);
      if (res.data.isFile) {
         setFileContent(res.data.content);
      } else {
         setFiles(res.data);
      }
    } catch (e) {
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchFiles();
    setSelectedFiles(new Set());
    setSearchQuery("");
  }, [path, serverId]);

  const goUp = () => {
    if (editingFile) {
      setEditingFile(null);
      return;
    }
    if (path === "/") return;
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    setPath("/" + parts.join("/"));
  };

  const navigateToBreadcrumb = (index: number) => {
    if (editingFile) setEditingFile(null);
    const parts = path.split("/").filter(Boolean);
    const newPath = "/" + parts.slice(0, index + 1).join("/");
    setPath(newPath);
  };

  const traverse = (dirName: string) => {
    setPath(path.endsWith("/") ? path + dirName : path + "/" + dirName);
  };

  const openFile = async (name: string) => {
    if (!name.match(/\.(txt|json|yml|yaml|properties|log|phar|ini|conf)$/i)) {
      alert("Only text/config formats are supported for editing.");
      return;
    }
    const fullPath = path.endsWith("/") ? path + name : path + "/" + name;
    try {
      const res = await axios.get(`/api/servers/${serverId}/files?path=${encodeURIComponent(fullPath)}`);
      if (res.data.isFile) {
         setEditingFile(name);
         setFileContent(res.data.content);
      }
    } catch (e) {
      alert("Failed to load file");
    }
  };

  const saveFile = async () => {
    setIsSaving(true);
    try {
      const fullPath = path.endsWith("/") ? path + editingFile : path + "/" + editingFile;
      await axios.post(`/api/servers/${serverId}/files/save`, {
        filePath: fullPath,
        content: fileContent
      });
    } catch(e) {
      console.error("Failed to save file.", e);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedFiles.size} items?`)) return;
    
    try {
      const p = path.endsWith("/") ? path : path + "/";
      const pathsToDelete = Array.from(selectedFiles).map(name => p + name);
      
      setDeletingFile("multiple");
      await axios.delete(`/api/servers/${serverId}/files`, {
        data: { paths: pathsToDelete }
      });
      setSelectedFiles(new Set());
      fetchFiles();
    } catch(e) {
      console.error("Failed to delete files", e);
    } finally {
      setDeletingFile(null);
    }
  };

  const handleRenameSelected = () => {
    if (selectedFiles.size !== 1) return;
    const name = Array.from(selectedFiles)[0];
    setRenamingFile(name);
    setNewName(name);
  };

  const handleRename = async (oldName: string) => {
    if(!newName.trim() || newName === oldName) {
      setRenamingFile(null);
      return;
    }
    try {
      const p = path.endsWith("/") ? path : path + "/";
      await axios.post(`/api/servers/${serverId}/files/rename`, {
        oldPath: p + oldName,
        newPath: p + newName
      });
      setRenamingFile(null);
      fetchFiles();
    } catch(e) {
      console.error("Failed to rename", e);
    }
  };

  const handleUnzipSelected = async () => {
    if (selectedFiles.size !== 1) return;
    const name = Array.from(selectedFiles)[0];
    setIsUnzipping(true);
    try {
      const p = path.endsWith("/") ? path : path + "/";
      await axios.post(`/api/servers/${serverId}/files/unzip`, {
        path: p + name
      });
      setSelectedFiles(new Set());
      fetchFiles();
    } catch(e) {
      console.error("Failed to unzip", e);
    } finally {
      setIsUnzipping(false);
    }
  };

  const handleZipSelected = async () => {
    if (selectedFiles.size === 0) return;
    const outputName = prompt("Enter archive name:", "archive.zip");
    if (!outputName) return;

    setIsZipping(true);
    try {
      const p = path.endsWith("/") ? path : path + "/";
      await axios.post(`/api/servers/${serverId}/files/zip`, {
        dirPath: p,
        fileNames: Array.from(selectedFiles),
        outputName: outputName.endsWith(".zip") ? outputName : outputName + ".zip"
      });
      setSelectedFiles(new Set());
      fetchFiles();
    } catch (e) {
      console.error("Failed to zip files", e);
    } finally {
      setIsZipping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    try {
      setUploadProgress(0);
      await axios.post(`/api/servers/${serverId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      fetchFiles();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadProgress(null);
      e.target.value = "";
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
    }
  };

  const toggleSelectFile = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedFiles);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setSelectedFiles(newSet);
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const pathParts = path.split("/").filter(Boolean);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative min-h-0 h-full w-full bg-[#030408] p-4 md:p-6 text-gray-100 font-sans">
      
      {/* Top Header & Breadcrumb Bar */}
      <div className="p-4 md:p-5 mb-5 flex flex-col sm:flex-row items-center justify-between bg-black/50 backdrop-blur-2xl rounded-2xl border border-white/10 shrink-0 gap-4 shadow-2xl">
        <div className="flex items-center space-x-3 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button 
            onClick={goUp} 
            disabled={path === "/" && !editingFile} 
            className="p-2.5 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl text-gray-300 disabled:opacity-30 disabled:pointer-events-none transition-all shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1.5 font-mono text-xs md:text-sm font-semibold bg-black/60 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-inner text-sky-400 overflow-x-auto whitespace-nowrap">
            <span 
              onClick={() => { setPath("/"); setEditingFile(null); }} 
              className="hover:text-white cursor-pointer transition-colors"
            >
              root
            </span>
            {pathParts.map((part, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight size={14} className="text-gray-600 shrink-0" />
                <span 
                  onClick={() => navigateToBreadcrumb(idx)} 
                  className="hover:text-white cursor-pointer transition-colors max-w-[120px] truncate"
                >
                  {part}
                </span>
              </React.Fragment>
            ))}
            {editingFile && (
              <>
                <ChevronRight size={14} className="text-gray-600 shrink-0" />
                <span className="text-amber-400 truncate">{editingFile}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Search Bar */}
        {!editingFile && (
          <div className="w-full sm:w-72 order-last sm:order-none">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input 
                type="text" 
                placeholder="Search files..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-sky-500/50 rounded-xl py-2 pl-9 pr-4 text-xs md:text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-gray-500"
              />
            </div>
          </div>
        )}

        {/* Action Button (Upload / Save) */}
        {!editingFile ? (
          <div>
            {uploadProgress !== null ? (
              <div className="flex items-center space-x-2 px-4 py-2 bg-sky-500/20 border border-sky-500/30 rounded-xl text-xs font-semibold text-sky-400">
                <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin"></div>
                <span>{uploadProgress === 100 ? "Processing..." : `${uploadProgress}%`}</span>
              </div>
            ) : (
              <label className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 active:scale-95 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-sky-500/20 cursor-pointer">
                <input type="file" onChange={handleFileUpload} className="hidden" />
                <Upload size={15} /> <span>Upload File</span>
              </label>
            )}
          </div>
        ) : (
          <button 
            disabled={isSaving} 
            onClick={saveFile} 
            className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div> : <Save size={15} />}
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        )}
      </div>

      {/* Main File Browser / Code Editor Body */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          {editingFile ? (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <textarea 
                value={fileContent} 
                onChange={(e) => setFileContent(e.target.value)}
                className="flex-1 w-full h-full bg-black/60 border border-white/10 rounded-2xl p-5 text-sky-200 font-mono text-xs md:text-sm leading-relaxed focus:outline-none focus:border-sky-500/40 resize-none custom-scrollbar min-h-0 shadow-2xl"
                spellCheck={false}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="filelist"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 space-y-1.5"
            >
              {/* List Header */}
              {filteredFiles.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center space-x-3">
                    <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                      {selectedFiles.size === filteredFiles.length ? <CheckSquare size={16} className="text-sky-400" /> : <Square size={16} />}
                    </button>
                    <span>Name</span>
                  </div>
                  <span>Size</span>
                </div>
              )}

              {filteredFiles.length === 0 && (
                <div className="text-center py-16 text-gray-500 text-sm font-medium">
                  Folder is empty or no files match search.
                </div>
              )}
              
              {/* File Row */}
              {filteredFiles.map(f => {
                const isSelected = selectedFiles.has(f.name);
                return (
                  <div 
                    key={f.name} 
                    onClick={(e) => toggleSelectFile(f.name, e)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl group transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-sky-500/10 border-sky-500/30 shadow-lg shadow-sky-500/5' 
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 flex-1 overflow-hidden">
                      <button onClick={(e) => toggleSelectFile(f.name, e)} className={`transition-colors ${isSelected ? 'text-sky-400' : 'text-gray-600 group-hover:text-gray-400'}`}>
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      
                      <div 
                        className="flex items-center space-x-3 flex-1 overflow-hidden" 
                        onClick={(e) => { e.stopPropagation(); f.isDirectory ? traverse(f.name) : openFile(f.name); }}
                      >
                        {f.isDirectory ? (
                          <Folder className="text-amber-400 shrink-0" size={18} />
                        ) : f.name.endsWith('.yml') || f.name.endsWith('.json') ? (
                          <FileCode className="text-sky-400 shrink-0" size={18} />
                        ) : (
                          <FileText className="text-gray-400 shrink-0" size={18} />
                        )}

                        {renamingFile === f.name ? (
                          <input 
                            autoFocus
                            type="text" 
                            value={newName} 
                            onClick={e => e.stopPropagation()}
                            onChange={e => setNewName(e.target.value)}
                            onBlur={() => handleRename(f.name)}
                            onKeyDown={e => e.key === 'Enter' && handleRename(f.name)}
                            className="bg-black border border-sky-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none w-full max-w-xs"
                          />
                        ) : (
                          <span className="font-medium text-gray-200 text-xs md:text-sm truncate group-hover:text-sky-300 transition-colors">
                            {f.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 font-mono shrink-0 pl-4">
                      {!f.isDirectory ? `${(f.size / 1024).toFixed(1)} KB` : "Folder"}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cyber Action Bar for Selected Items */}
        <AnimatePresence>
          {selectedFiles.size > 0 && !editingFile && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-2xl border border-sky-500/30 rounded-2xl shadow-2xl px-4 py-2 flex items-center space-x-3 z-30"
            >
              <span className="text-xs font-bold text-sky-400">
                {selectedFiles.size} Selected
              </span>
              <div className="h-4 w-px bg-white/20"></div>
              
              {selectedFiles.size === 1 && (
                <>
                  <button onClick={handleRenameSelected} className="p-2 text-gray-300 hover:text-sky-400 hover:bg-white/10 rounded-xl transition-all" title="Rename">
                    <Edit2 size={15} />
                  </button>
                  {(Array.from(selectedFiles)[0] as string).endsWith('.zip') && (
                    <button onClick={handleUnzipSelected} disabled={isUnzipping} className="p-2 text-gray-300 hover:text-amber-400 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50" title="Extract Zip">
                      {isUnzipping ? <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div> : <Archive size={15} />}
                    </button>
                  )}
                </>
              )}
              
              <button onClick={handleZipSelected} disabled={isZipping} className="p-2 text-gray-300 hover:text-emerald-400 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50" title="Compress (Zip)">
                {isZipping ? <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div> : <Download size={15} />}
              </button>
              
              <button onClick={deleteSelectedFiles} disabled={deletingFile === "multiple"} className="p-2 text-gray-300 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50" title="Delete">
                {deletingFile === "multiple" ? <div className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin"></div> : <Trash2 size={15} />}
              </button>

              <div className="h-4 w-px bg-white/20"></div>
              <button onClick={() => setSelectedFiles(new Set())} className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-all" title="Clear">
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(isUnzipping || isZipping || isSaving) && <LoadingOverlay />}
    </div>
  );
      }
  
