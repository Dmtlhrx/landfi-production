import React, { Suspense, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  DollarSign,
  FileCheck,
  Users,
  TrendingUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';
import { Button, BeninPatternBackground, NeonDivider, StatKPI } from '@hedera-africa/ui';
import Hero3D from '@/components/Hero3D';
import { useTranslation } from 'react-i18next';

// Composant lecteur vidéo professionnel
const VideoPlayer = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const containerRef = useRef(null);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch(err => console.log(err));
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative group rounded-2xl overflow-hidden bg-black shadow-2xl shadow-primary-500/20"
    >
      <div className="relative w-full aspect-video bg-dark-950">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlayPause}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230f0f1e' width='1920' height='1080'/%3E%3C/svg%3E"
        >
          <source src="/landfi-demo.mp4" type="video/mp4" />
        </video>

        {/* Overlay dégradé */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Bouton Play Central */}
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
            onClick={togglePlayPause}
          >
            <div className="w-20 h-20 rounded-full bg-primary-500/90 backdrop-blur-sm flex items-center justify-center hover:bg-primary-400/90 transition-colors shadow-lg shadow-primary-500/50">
              <Play className="h-10 w-10 text-white fill-white" />
            </div>
          </motion.div>
        )}

        {/* Contrôles vidéo */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {/* Barre de progression */}
          <div
            className="w-full h-1 bg-gray-600/50 rounded-full cursor-pointer mb-3 hover:h-2 transition-all group/progress"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all shadow-lg shadow-primary-500/50 group-hover/progress:shadow-primary-500/75"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Boutons de contrôle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-primary-400 transition-colors p-1"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 fill-white" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-primary-400 transition-colors p-1"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <span className="text-white text-xs ml-2 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-primary-400 transition-colors p-1"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Badge Premium */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-primary-500 to-secondary-500 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg shadow-primary-500/50">
        ▶ DEMO HD
      </div>
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: FileCheck,
      title: 'HTS Tokenization',
      description: 'Transform your plots into secure NFTs on Hedera',
    },
    {
      icon: Shield,
      title: 'HCS Traceability',
      description: 'Immutable history of all transactions',
    },
    {
      icon: Users,
      title: 'DID Identity',
      description: 'Verified decentralized identity system',
    },
    {
      icon: DollarSign,
      title: 'Integrated DeFi',
      description: 'NFT collateral loans and optimized liquidity',
    },
  ];

  const stats = [
    { icon: Globe, title: 'Tokenized Plots', value: '2,847' },
    { icon: DollarSign, title: 'Total Volume', value: '$12.4M' },
    { icon: TrendingUp, title: 'Active Loans', value: '156' },
    { icon: Users, title: 'Users', value: '1,234' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      <BeninPatternBackground className="fixed inset-0" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <Suspense fallback={null}>
          <Hero3D />
        </Suspense>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-heading text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Revolutionize
            </span>
            <br />
            <span className="text-white">Land Ownership</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Tokenize your land. Get an express loan or find offers from the community - simple and secure
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth">
              <Button size="lg" className="neon-glow-hover">
                {t('landing.cta.launch')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              {t('landing.cta.demo')}
            </Button>
          </motion.div>
        </div>
      </section>

      <NeonDivider className="my-20" />

      {/* Video Demo Section */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl font-bold text-white text-center mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-gray-400 text-center max-w-2xl mx-auto">
              Experience the future of decentralized land ownership with our interactive demo
            </p>
          </motion.div>

          <VideoPlayer />
        </div>
      </section>

      <NeonDivider className="my-20" />

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <StatKPI
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  className="hover:scale-105"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <NeonDivider className="my-20" />

      {/* Features Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              Cutting-Edge Technologies
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Harness the power of Hedera Hashgraph for transparent and secure land ownership
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass p-6 rounded-xl hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300"
              >
                <div className="p-3 bg-primary-500/20 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary-400" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="glass p-12 rounded-2xl"
          >
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 mb-8">
              Join the decentralized land ownership revolution
            </p>
            <Link to="/auth">
              <Button size="lg" className="neon-glow-hover">
                Create an Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;