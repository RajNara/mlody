import { motion, type Variants } from 'framer-motion';

interface Props {
  onStart: () => void;
}

export default function LandingView({ onStart }: Props) {
  // Shared animation settings for scroll triggers
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="bg-black text-white min-h-screen font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div 
          initial="hidden" animate="visible" variants={fadeUp}
          className="z-10 text-center"
        >
          <h1 className="text-8xl md:text-[10rem] font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
            ML<span className="text-white">ody</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-400 font-medium tracking-tight">
            Find your rhythm in the data.
          </p>
        </motion.div>
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* Problem Statement Section */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeUp}
          className="max-w-4xl mx-auto text-center backdrop-blur-xl bg-white/5 border border-white/10 p-12 md:p-20 rounded-3xl shadow-2xl"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Streaming algorithms are <span className="text-red-400">broken.</span>
          </h2>
          <p className="text-xl md:text-3xl text-gray-300 leading-relaxed font-light">
            They rely on what <i className="text-white font-medium">everyone else</i> likes.<br/>
            But your ears are unique. Why settle for an average?
          </p>
        </motion.div>
      </section>

      {/* Features/Evolution Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          className="max-w-6xl mx-auto w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-[3rem] p-12 md:p-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-20 tracking-tight">
            From raw songs to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">MLody.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-6 bg-white/10 h-24 w-24 flex items-center justify-center rounded-full shadow-inner">🔍</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Seed</h3>
              <p className="text-gray-400 text-lg leading-relaxed">Search for a few songs you love (and hate) to establish a baseline.</p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-6 bg-white/10 h-24 w-24 flex items-center justify-center rounded-full shadow-inner">🧪</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Calibrate</h3>
              <p className="text-gray-400 text-lg leading-relaxed">Teach the model your taste. React to quick audio samples to sharpen its accuracy.</p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-6 bg-white/10 h-24 w-24 flex items-center justify-center rounded-full shadow-inner">🧬</div>
              <h3 className="text-2xl font-bold mb-4 text-white">Evolve</h3>
              <p className="text-gray-400 text-lg leading-relaxed">Watch your data evolve into your unique MLody in real-time.</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 pt-10 border-t border-white/10 flex flex-wrap justify-center gap-8 md:gap-16 text-lg font-medium text-gray-400">
            <span>🎛️ <strong className="text-white">250+</strong> Audio Dimensions</span>
            <span className="hidden md:block text-gray-700">•</span>
            <span>⚡ Real-Time</span>
            <span className="hidden md:block text-gray-700">•</span>
            <span>🔒 <strong className="text-white">100%</strong> Private</span>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-32 flex flex-col items-center justify-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <button 
            onClick={onStart}
            className="group relative px-10 py-5 bg-white text-black text-2xl font-bold rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 opacity-0 group-hover:opacity-20 transition-opacity" />
            Start Listening 🎧
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 flex flex-col items-center text-gray-500 text-sm">
        <p className="mb-6">&copy; 2026 MLody. All rights reserved.</p>
        <div className="flex gap-6">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">X</div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">IG</div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">IN</div>
        </div>
      </footer>

    </div>
  );
}