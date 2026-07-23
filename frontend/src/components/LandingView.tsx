import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface Props {
  onStart: () => void;
}

export default function LandingView({ onStart }: Props) {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const slideFromLeft: Variants = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const slideFromRight: Variants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const floatingNotes = [
    { id: 1, top: '10%', left: '10%', size: 'text-3xl', delay: 0 },
    { id: 2, top: '25%', right: '15%', size: 'text-5xl', delay: 1 },
    { id: 3, top: '45%', left: '8%', size: 'text-4xl', delay: 0.5 },
    { id: 4, top: '60%', right: '10%', size: 'text-3xl', delay: 2 },
    { id: 5, top: '80%', left: '12%', size: 'text-5xl', delay: 1.5 },
    { id: 6, top: '92%', right: '20%', size: 'text-4xl', delay: 0.8 },
  ];

  return (
    <div className="relative bg-black text-white min-h-screen font-sans selection:bg-purple-500 selection:text-white">
      
      {floatingNotes.map((note) => (
        <motion.div
          key={note.id}
          className={`absolute ${note.size} opacity-20 pointer-events-none z-0`}
          style={{ top: note.top, left: note.left, right: note.right }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: note.delay }}
        >
          {note.id % 2 === 0 ? '🎶' : '🎵'}
        </motion.div>
      ))}

      <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUp}
          className="z-10 text-center flex flex-col items-center"
        >
          <h1 
            className="text-6xl md:text-8xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400 drop-shadow-lg px-4 pb-4 leading-normal"
            style={{ fontFamily: "'Sniglet', system-ui, cursive" }}
          >
            MLody
          </h1>
          <p 
            className="text-xl md:text-2xl text-gray-400 font-medium tracking-tight"
            style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
          >
            Find your rhythm in the data.
          </p>
        </motion.div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      </section>

      <div className="overflow-hidden w-full">
        <section className="py-20 flex items-center justify-center px-6 relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={slideFromLeft}
            className="max-w-3xl mx-auto text-center backdrop-blur-xl bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">
              Streaming algorithms are <span className="text-red-400">broken.</span>
            </h2>
            <p className="text-base md:text-xl text-gray-300 leading-relaxed font-light">
              They rely on what <i className="text-white font-medium">everyone else</i> likes.<br/>
              But your ears are unique. Why settle for an average?
            </p>
          </motion.div>
        </section>
      </div>

      <div className="overflow-hidden w-full">
        <section className="py-20 flex flex-col items-center justify-center px-6 relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={slideFromRight}
            className="max-w-5xl mx-auto w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 tracking-tight">
              From raw songs to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">MLody.</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-4 bg-white/10 h-12 w-12 flex items-center justify-center rounded-full shadow-inner">🌱</div>
                <h3 className="text-lg font-bold mb-2 text-white">Seed</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Search for a few songs you love (and hate) to establish a baseline.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-4 bg-white/10 h-12 w-12 flex items-center justify-center rounded-full shadow-inner">🎛️</div>
                <h3 className="text-lg font-bold mb-2 text-white">Calibrate</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Teach the model your taste. React to quick audio samples to sharpen its accuracy.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="text-2xl mb-4 bg-white/10 h-12 w-12 flex items-center justify-center rounded-full shadow-inner">🧬</div>
                <h3 className="text-lg font-bold mb-2 text-white">Evolve</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Watch your data evolve into your unique MLody in real-time.</p>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-6 md:gap-12 text-sm font-medium text-gray-400">
              <span>🔊 <strong className="text-white">250+</strong> Audio Dimensions</span>
              <span className="hidden md:block text-gray-700">|</span>
              <span>⚡ Real-Time</span>
              <span className="hidden md:block text-gray-700">|</span>
              <span>🔒 <strong className="text-white">100%</strong> Private</span>
            </div>
          </motion.div>
        </section>
      </div>

      <section className="py-20 flex flex-col items-center justify-center relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-white text-black text-lg font-bold rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity" />
            Start Listening 🎧
          </button>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 py-8 flex flex-col items-center text-gray-500 text-sm relative z-10">
        <p className="mb-4">&copy; 2026 MLody. All rights reserved.</p>
        
        <div className="flex gap-6">
          <a href="#" className="text-gray-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a href="#" className="text-gray-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}