'use client'

import { useState } from 'react'
import { Play, CheckCircle, Lock, ChevronRight } from 'lucide-react'

const modules = [
  {
    id: 1,
    title: "Introduction et Manipulation",
    description: "Les bases pour porter et déplacer votre bébé en toute sécurité.",
    duration: "15:20",
    completed: true,
    videoUrl: "#"
  },
  {
    id: 2,
    title: "Le Portage Physiologique",
    description: "Comment utiliser l'écharpe de portage et le porte-bébé correctement.",
    duration: "24:45",
    completed: false,
    videoUrl: "#"
  },
  {
    id: 3,
    title: "Les Soins Quotidiens",
    description: "Le bain, le change et les soins du cordon sans stress.",
    duration: "18:10",
    completed: false,
    videoUrl: "#"
  },
  {
    id: 4,
    title: "Sommeil et Apaisement",
    description: "Techniques pour calmer les pleurs et favoriser un bon sommeil.",
    duration: "22:30",
    completed: false,
    videoUrl: "#",
    locked: true
  }
]

export default function AcademyPage() {
  const [activeModule, setActiveModule] = useState(modules[0])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">
          Academy : <span className="text-accent">Les gestes essentiels</span>
        </h1>
        <p className="text-text-muted mt-2">Bienvenue Gilles, continuez votre apprentissage là où vous vous étiez arrêté.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Video View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-surface-card border border-surface-border rounded-xl overflow-hidden relative group">
            {activeModule.locked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 text-center p-6">
                <Lock className="w-12 h-12 text-accent mb-4" />
                <h3 className="text-xl font-bold text-white uppercase">Module Verrouillé</h3>
                <p className="text-text-muted mt-2 max-w-xs">Ce module est disponible dans la version Premium de la formation.</p>
                <button className="mt-6 px-6 py-3 bg-accent text-black font-bold uppercase text-sm hover:scale-105 transition-all">
                  Améliorer mon accès
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-deepViolet/10">
                <button className="w-20 h-20 bg-accent text-black rounded-full flex items-center justify-center pl-1 hover:scale-110 transition-all shadow-xl shadow-accent/20">
                  <Play className="fill-current" />
                </button>
              </div>
            )}
            <img 
              src={`https://images.unsplash.com/photo-1555252333-9f8e92e65ee9?q=80&w=2070&auto=format&fit=crop`} 
              className="w-full h-full object-cover opacity-40"
              alt="Thumbnail"
            />
          </div>

          <div className="bg-surface-card border border-surface-border p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white uppercase">{activeModule.title}</h2>
              <span className="text-xs font-mono text-accent bg-accent/10 px-3 py-1 rounded-full uppercase">
                {activeModule.duration}
              </span>
            </div>
            <p className="text-text-muted leading-relaxed">
              {activeModule.description}
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
               <div className="p-4 border border-surface-border rounded-lg bg-bg/50">
                  <span className="text-xs font-mono text-text-muted uppercase block mb-1">Objectif</span>
                  <p className="text-sm text-white">Maîtriser la sécurité physique</p>
               </div>
               <div className="p-4 border border-surface-border rounded-lg bg-bg/50">
                  <span className="text-xs font-mono text-text-muted uppercase block mb-1">Support</span>
                  <p className="text-sm text-white">Guide PDF téléchargeable</p>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Modules List */}
        <div className="space-y-4">
          <h3 className="font-mono text-xs font-bold text-text-muted uppercase tracking-widest pl-2">
            Programme de la formation
          </h3>
          <div className="space-y-3">
            {modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  activeModule.id === mod.id 
                    ? 'bg-accent/10 border-accent/50 ring-1 ring-accent/50' 
                    : 'bg-surface-card border-surface-border hover:border-gray-600'
                }`}
              >
                <div className={`mt-1 flex-shrink-0 ${mod.completed ? 'text-green-500' : mod.locked ? 'text-gray-500' : 'text-accent'}`}>
                  {mod.completed ? <CheckCircle size={18} /> : mod.locked ? <Lock size={18} /> : <Play size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold uppercase tracking-tight ${activeModule.id === mod.id ? 'text-accent' : 'text-white'}`}>
                      {mod.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-text-muted uppercase">
                    <span>{mod.duration}</span>
                    <span className="w-1 h-1 bg-surface-border rounded-full" />
                    <span>Module {mod.id}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-surface-border mt-2" />
              </button>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-br from-deepViolet to-black border border-accent/20 rounded-xl overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-white font-bold uppercase text-sm">Besoin d'aide ?</h4>
              <p className="text-text-muted text-xs mt-2 mb-4">Gilles et son équipe répondent à vos questions sous 24h.</p>
              <button className="text-xs font-bold text-accent uppercase flex items-center gap-2 hover:gap-3 transition-all">
                Poser une question <ChevronRight size={14} />
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/10 blur-2xl rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
