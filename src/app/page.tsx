"use client";

import Link from "next/link";
import { Wand2, ArrowRight, Upload, Palette, Download, CheckCircle, Sparkles, Zap, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900/20 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.header 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-button text-orange-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by AI • Built for Whop
          </div>
          
          <h1 className="text-7xl font-bold text-white mb-6 bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">
            MockupMagic AI
          </h1>
          
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
            Transform your designs into professional mockups using AI.
            <span className="text-orange-300 font-semibold"> Perfect for Whop sellers</span> and digital creators looking to showcase their products with stunning visuals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/studio" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-lg rounded-xl hover:opacity-90 transition-all transform hover:scale-105 shadow-2xl hover:shadow-orange-500/25" 
              data-testid="start-creating-button"
            >
              <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" /> 
              Start Creating Mockups 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2 px-6 py-3 glass-button text-white hover:bg-white/10 transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              View Dashboard
            </Link>
          </div>
        </motion.header>

        <main className="max-w-6xl mx-auto">
          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="glass-card p-8">
              <motion.h2 
                className="text-3xl font-bold text-center mb-8 text-white"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                How It Works
              </motion.h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Upload,
                    title: "1. Upload Your Design",
                    description: "Upload your product image, logo, or design that you want to mockup",
                    delay: 0.4
                  },
                  {
                    icon: Palette,
                    title: "2. Choose Template",
                    description: "Select from our AI-powered templates or describe your perfect mockup",
                    delay: 0.5
                  },
                  {
                    icon: Download,
                    title: "3. Generate & Download",
                    description: "Get your professional mockup in seconds, ready for your Whop store",
                    delay: 0.6
                  }
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    className="text-center group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: step.delay }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-orange-500/80 to-red-500/80 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <step.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-orange-300 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: Sparkles,
                  title: "AI-Powered Generation",
                  description: "Our advanced AI creates stunning, professional mockups from your designs in seconds.",
                  color: "from-purple-500/20 to-pink-500/20",
                  iconColor: "text-purple-400"
                },
                {
                  icon: Palette,
                  title: "Multiple Templates",
                  description: "Choose from hundreds of templates or create custom mockups for any product type.",
                  color: "from-blue-500/20 to-cyan-500/20",
                  iconColor: "text-blue-400"
                },
                {
                  icon: Target,
                  title: "Whop Integration",
                  description: "Seamlessly integrate with your Whop store to boost sales with professional mockups.",
                  color: "from-orange-500/20 to-red-500/20",
                  iconColor: "text-orange-400"
                },
                {
                  icon: Zap,
                  title: "Fast & Easy",
                  description: "No design skills needed. Upload, select, and download your mockups in minutes.",
                  color: "from-yellow-500/20 to-orange-500/20",
                  iconColor: "text-yellow-400"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="glass-card p-6 h-full group-hover:shadow-lg group-hover:shadow-orange-500/10 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} backdrop-blur-md rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 group-hover:text-gray-200 transition-colors leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <motion.div 
              className="glass-card p-8 mb-8 border-green-500/30"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="flex items-center justify-center gap-3 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-green-300">
                  Ready to Use!
                </h3>
              </motion.div>
              <p className="text-green-200 text-lg leading-relaxed">
                MockupMagic AI is fully functional and ready to create stunning mockups for your products.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-orange-500/25"
                >
                  <Wand2 className="w-5 h-5" />
                  Start Creating
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 glass-button text-white hover:bg-white/10 transition-all"
                >
                  <TrendingUp className="w-5 h-5" />
                  View Dashboard
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
