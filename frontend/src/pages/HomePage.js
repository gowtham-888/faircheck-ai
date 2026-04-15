import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Shield, TrendingUp, Users, AlertTriangle } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Bias Detection",
      description: "Advanced algorithms to identify hidden biases in your hiring data"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Fairness Scoring",
      description: "Get a comprehensive 0-100 fairness score for your processes"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Equal Opportunity",
      description: "Ensure all candidates are evaluated fairly regardless of background"
    },
    {
      icon: <AlertTriangle className="w-8 h-8" />,
      title: "Real-time Alerts",
      description: "Instant notifications when bias patterns are detected"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] scroll-smooth">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1762279388952-85187155e48d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGZ1dHVyaXN0aWMlMjBkYXRhfGVufDB8fHx8MTc3NjIxNTg2Mnww&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#0A0F1C]/80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0F1C]/50 to-[#0A0F1C]"></div>
        </div>

        <motion.div 
          className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-6">
              <span className="gradient-text">Build Fair AI.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5FF] to-[#7B61FF]">
                Detect Bias Before It Hurts.
              </span>
            </h1>
          </motion.div>

          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg leading-relaxed text-slate-300 max-w-3xl mx-auto mb-12"
          >
            Empower your organization with AI-driven fairness analysis. Upload your hiring data
            and receive instant insights into potential biases, ensuring equal opportunity for all candidates.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <button 
              data-testid="hero-get-started-btn"
              onClick={() => navigate('/analysis')}
              className="btn-primary px-8 py-4 text-lg"
            >
              Get Started
            </button>
            <button 
              data-testid="hero-demo-btn"
              onClick={() => navigate('/analysis?demo=true')}
              className="btn-secondary px-8 py-4 text-lg"
            >
              Try Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-[#00F5FF]/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-[#00F5FF] rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 md:px-12 relative">
        <motion.div 
          className="max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.h2 
            variants={itemVariants}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white text-center mb-16"
          >
            Why Choose FairCheck AI?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="text-[#00F5FF] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white/90 mb-3">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-slate-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 md:px-12 relative">
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1773429494448-1c13750ad80d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG5lb24lMjBuZXR3b3JrfGVufDB8fHx8MTc3NjIxNTg2Mnww&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>

        <motion.div 
          className="max-w-4xl mx-auto relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.h2 
            variants={itemVariants}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white text-center mb-8"
          >
            Understanding AI Bias
          </motion.h2>

          <motion.div variants={itemVariants} className="glass-card p-8">
            <p className="text-base leading-relaxed text-slate-300 mb-6">
              AI bias occurs when machine learning systems produce systematically prejudiced results due to erroneous assumptions in the training data or algorithm design. In hiring contexts, this can lead to unfair discrimination against certain groups based on gender, race, age, or socioeconomic status.
            </p>
            <p className="text-base leading-relaxed text-slate-300 mb-6">
              FairCheck AI analyzes your hiring data using advanced statistical methods, including <strong className="text-[#00F5FF]">disparate impact ratio</strong> (the 80% rule) and <strong className="text-[#00F5FF]">statistical parity analysis</strong>, to identify potential biases before they become systemic problems.
            </p>
            <p className="text-base leading-relaxed text-slate-300">
              By detecting and addressing bias early, organizations can build more diverse, equitable teams while ensuring compliance with fair hiring practices and regulations.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6">
            <img 
              src="https://images.unsplash.com/photo-1759884247144-53d52c31f859?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxoYWNrYXRob24lMjB0ZWFtJTIwY29kaW5nfGVufDB8fHx8MTc3NjIxNTg1OXww&ixlib=rb-4.1.0&q=85"
              alt="Team"
              className="w-48 h-32 object-cover rounded-lg mx-auto mb-4 opacity-80"
            />
          </div>
          <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white/90 mb-3">
            Built for Hackathon 2026
          </h3>
          <p className="text-sm tracking-wide text-slate-400 mb-6">
            Created by passionate developers committed to building fair and ethical AI systems
          </p>
          <p className="text-sm tracking-wide text-slate-400">
            © 2026 FairCheck AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
