import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Calendar, Award, MapPin, Clock, User } from 'lucide-react';
import { Program } from '../types';

interface HomepageImage {
  id: string;
  src: string;
  alt: string;
  type: 'left' | 'right';
}

interface HomePageProps {
  programs: Program[];
  leftImages?: HomepageImage[];
  rightImages?: HomepageImage[];
}

// Mock image data for scrolling boxes - in real implementation, these would come from props or state
const leftImages: HomepageImage[] = [
  { id: '1', src: '/download.png', alt: 'NSS Activity 1', type: 'left' },
  { id: '2', src: '/mamo-logo.png', alt: 'NSS Activity 2', type: 'left' },
  { id: '3', src: '/download.png', alt: 'NSS Activity 3', type: 'left' },
  { id: '4', src: '/mamo-logo.png', alt: 'NSS Activity 4', type: 'left' },
  { id: '5', src: '/download.png', alt: 'NSS Activity 5', type: 'left' },
  { id: '6', src: '/mamo-logo.png', alt: 'NSS Activity 6', type: 'left' },
];

const rightImages: HomepageImage[] = [
  { id: '7', src: '/mamo-logo.png', alt: 'NSS Activity 7', type: 'right' },
  { id: '8', src: '/download.png', alt: 'NSS Activity 8', type: 'right' },
  { id: '9', src: '/mamo-logo.png', alt: 'NSS Activity 9', type: 'right' },
  { id: '10', src: '/download.png', alt: 'NSS Activity 10', type: 'right' },
  { id: '11', src: '/mamo-logo.png', alt: 'NSS Activity 11', type: 'right' },
  { id: '12', src: '/download.png', alt: 'NSS Activity 12', type: 'right' },
];

// Animated Counter Component
const AnimatedCounter: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ 
  end, 
  duration = 2, 
  suffix = '' 
}) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 0.3 }
    });

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      const currentCount = Math.floor(progress * end);
      
      setCount(currentCount);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration, controls]);

  return (
    <motion.span animate={controls}>
      {count}{suffix}
    </motion.span>
  );
};

// Floating Background Elements
const FloatingElements: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-20 left-10 w-16 h-16 bg-blue-500/10 rounded-full"
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute top-40 right-20 w-12 h-12 bg-orange-500/10 rounded-full"
      animate={{
        y: [0, 15, 0],
        x: [0, -15, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute bottom-40 left-20 w-20 h-20 bg-emerald-500/10 rounded-full"
      animate={{
        y: [0, -25, 0],
        x: [0, 20, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <motion.div
      className="absolute bottom-20 right-10 w-14 h-14 bg-blue-600/10 rounded-full"
      animate={{
        y: [0, 20, 0],
        x: [0, -10, 0],
      }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  </div>
);

// Scrolling Image Box Component
const ScrollingImageBox: React.FC<{
  images: typeof leftImages;
  direction: 'down' | 'up' | 'left' | 'right';
  className?: string;
}> = ({ images, direction, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine if it's horizontal or vertical scrolling
  const isHorizontal = direction === 'left' || direction === 'right';
  const isVertical = direction === 'up' || direction === 'down';

  return (
    <div 
      className={`overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm shadow-2xl border border-white/20 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className={isHorizontal ? "flex space-x-4 p-4" : "flex flex-col space-y-4 p-4"}
        animate={{
          x: isHorizontal 
            ? direction === 'right'
              ? isHovered ? 0 : -images.length * 200
              : isHovered ? 0 : images.length * 200
            : 0,
          y: isVertical
            ? direction === 'down' 
              ? isHovered ? 0 : -images.length * 280 
              : isHovered ? 0 : images.length * 280
            : 0,
        }}
        transition={{
          duration: isHovered ? 0.3 : images.length * 3,
          ease: "linear",
          repeat: isHovered ? 0 : Infinity,
        }}
        style={{
          animation: isHovered ? 'none' : 
            isHorizontal 
              ? `scroll${direction === 'right' ? 'Right' : 'Left'} ${images.length * 3}s linear infinite`
              : `scroll${direction === 'down' ? 'Down' : 'Up'} ${images.length * 3}s linear infinite`
        }}
      >
        {/* Duplicate images for seamless loop */}
        {[...images, ...images].map((image, index) => (
          <motion.div
            key={`${image.id}-${index}`}
            className={`rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${
              isHorizontal ? 'w-48 h-full flex-shrink-0' : 'w-full h-64'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ programs, leftImages: propLeftImages, rightImages: propRightImages }) => {
  const [collegeImageVisible, setCollegeImageVisible] = useState<boolean>(true);
  const [collegeTriedAlt, setCollegeTriedAlt] = useState<boolean>(false);
  
  // Use prop images if available, otherwise fall back to mock data
  const displayLeftImages = propLeftImages || leftImages;
  const displayRightImages = propRightImages || rightImages;
  
  const upcomingPrograms = programs
    .filter(program => new Date(program.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-800 overflow-hidden">
        <FloatingElements />
        
        <div className="relative z-10 py-16 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-20">
              
              {/* Left Scrolling Box - Hidden on mobile, shown below on tablet */}
              <div className="hidden lg:block">
                <ScrollingImageBox 
                  images={displayLeftImages} 
                  direction="down" 
                  className="h-[600px] w-56"
                />
              </div>

              {/* Center Content */}
              <div className="flex-1 text-center max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8"
                >
                  {/* Logo Section */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex justify-center items-center space-x-6 mb-8"
                  >
                    {/* NSS logo */}
                    <div className="relative">
                      <div className="rounded-full overflow-hidden w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center bg-white shadow-2xl">
                        <img src="/download.png" alt="NSS logo" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <motion.div
                        className="absolute -inset-2 rounded-full border-2 border-blue-300"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      />
                    </div>

                    {/* College logo with fallback */}
                    <div className="relative">
                      {collegeImageVisible ? (
                        <div className="rounded-full overflow-hidden w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center bg-white shadow-2xl">
                          <img
                            src="/mamo%20logo.png"
                            alt="College logo"
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const img = e.currentTarget;
                              if (!collegeTriedAlt) {
                                img.src = '/mamo-logo.png';
                                setCollegeTriedAlt(true);
                              } else {
                                setCollegeImageVisible(false);
                              }
                            }}
                            onLoad={() => setCollegeImageVisible(true)}
                          />
                        </div>
                      ) : (
                        <div className="rounded-full w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center bg-white shadow-2xl border">
                          <span className="text-sm font-semibold text-gray-700 text-center px-2">MAMO COLLEGE</span>
                        </div>
                      )}
                      <motion.div
                        className="absolute -inset-2 rounded-full border-2 border-emerald-300"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </motion.div>

                  {/* Main Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="space-y-4"
                  >
                    <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2 leading-tight">
                      NSS MAMOC
                    </h1>
                    <h2 className="text-2xl lg:text-4xl font-bold text-white/90 mb-6">
                      National Service Scheme
                    </h2>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed"
                  >
                    Empowering students through community service and social responsibility. 
                    Join us in making a positive impact on society while developing leadership skills and civic consciousness.
                  </motion.p>

                  {/* Animated Counters */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/30"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <img src="/download.png" alt="NSS icon" className="w-8 h-8 object-contain rounded-full" />
                        <div>
                          <div className="text-3xl font-bold text-white">
                            <AnimatedCounter end={100} suffix="+" />
                          </div>
                          <div className="text-sm text-white/80">Active Members</div>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/20 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/30"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <Calendar size={32} className="text-white" />
                        <div>
                          <div className="text-3xl font-bold text-white">
                            <AnimatedCounter end={50} suffix="+" />
                          </div>
                          <div className="text-sm text-white/80">Programs Annually</div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                </motion.div>
              </div>

              {/* Right Scrolling Box - Hidden on mobile, shown below on tablet */}
              <div className="hidden lg:block">
                <ScrollingImageBox 
                  images={displayRightImages} 
                  direction="up" 
                  className="h-[600px] w-56"
                />
              </div>
            </div>

            {/* Mobile/Tablet Scrolling Boxes - shown below center content */}
            <div className="lg:hidden mt-12">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white/90 mb-4 text-center">NSS Activities</h3>
                <ScrollingImageBox 
                  images={displayLeftImages} 
                  direction="right" 
                  className="h-48 w-full"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90 mb-4 text-center">Community Service</h3>
                <ScrollingImageBox 
                  images={displayRightImages} 
                  direction="left" 
                  className="h-48 w-full"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Mission Section */}
      <div className="relative bg-gradient-to-r from-blue-50 via-white to-emerald-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-10 left-10 w-20 h-20 bg-blue-400/10 rounded-full"
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-16 h-16 bg-emerald-400/10 rounded-full"
            animate={{
              y: [0, 25, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <h2 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-800 to-emerald-600 bg-clip-text text-transparent mb-6">
                Our Mission
              </h2>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="h-1 bg-gradient-to-r from-blue-500 to-emerald-500 mx-auto rounded-full"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
              className="text-xl lg:text-2xl text-gray-700 max-w-4xl mx-auto font-medium leading-relaxed"
            >
              To develop the personality and character of students through voluntary community service
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50, rotateY: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(59, 130, 246, 0.15)"
              }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10"
              >
                <User className="text-blue-700" size={28} />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">Community Service</h3>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                Engaging in meaningful community service projects that address local needs and create lasting positive impact.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50, rotateY: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: -5,
                boxShadow: "0 25px 50px rgba(16, 185, 129, 0.15)"
              }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10"
              >
                <Award className="text-emerald-700" size={28} />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors duration-300">Leadership Development</h3>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                Building leadership skills through hands-on experience in organizing and managing community service initiatives.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50, rotateY: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(249, 115, 22, 0.15)"
              }}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-orange-100 to-orange-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10"
              >
                <Calendar className="text-orange-700" size={28} />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors duration-300">Regular Programs</h3>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                Consistent programming throughout the year including camps, workshops, and awareness drives.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Upcoming Programs */}
      <div className="relative bg-gradient-to-r from-gray-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 right-10 w-24 h-24 bg-orange-400/10 rounded-full"
            animate={{
              y: [0, -20, 0],
              x: [0, -25, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-10 left-20 w-18 h-18 bg-blue-400/10 rounded-full"
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-block"
            >
              <motion.h2 
                className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-orange-600 bg-clip-text text-transparent mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                Upcoming Programs
              </motion.h2>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-orange-500 mx-auto rounded-full"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
              className="text-xl lg:text-2xl text-gray-700 font-medium"
            >
              Don't miss out on these exciting opportunities
            </motion.p>
          </motion.div>

          {upcomingPrograms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center py-12"
            >
              <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-500">No upcoming programs scheduled</p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {upcomingPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 50, rotateX: -10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.03, 
                    rotateY: 2,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group relative"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-emerald-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <div className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                      >
                        Upcoming
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded-full"
                      >
                        {new Date(program.date).toLocaleDateString()}
                      </motion.div>
                    </div>
                    
                    <motion.h3 
                      className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300"
                      whileHover={{ scale: 1.02 }}
                    >
                      {program.title}
                    </motion.h3>
                    <p className="text-gray-600 mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors duration-300">
                      {program.description}
                    </p>
                    
                    <div className="space-y-3">
                      <motion.div 
                        className="flex items-center text-gray-600 group-hover:text-blue-600 transition-colors duration-300"
                        whileHover={{ x: 5 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Clock size={16} className="mr-2" />
                        </motion.div>
                        <span className="text-sm font-medium">{program.time}</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center text-gray-600 group-hover:text-emerald-600 transition-colors duration-300"
                        whileHover={{ x: 5 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <MapPin size={16} className="mr-2" />
                        </motion.div>
                        <span className="text-sm font-medium">{program.venue}</span>
                      </motion.div>
                      <motion.div 
                        className="flex items-center text-gray-600 group-hover:text-orange-600 transition-colors duration-300"
                        whileHover={{ x: 5 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <User size={16} className="mr-2" />
                        </motion.div>
                        <span className="text-sm font-medium">Coordinators: {program.coordinatorIds?.length || 0}</span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="rounded-full overflow-hidden w-8 h-8 bg-white">
                  <img src="/download.png" alt="NSS logo small" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">NSS MAMOC</h3>
                  <p className="text-gray-400 text-sm">National Service Scheme</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="overflow-hidden w-10 h-10">
                  <img src="/mamo-logo.png" alt="College logo small" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm leading-snug">Muhammed Abdurahiman Memorial Orphanage College</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Committed to developing student personality through community service and social responsibility.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About NSS</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Programs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Registration</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 nss@college.edu</p>
                <p>📱 +91 98765 43210</p>
                <p>📍 MAMO College, Mukkam, Kozhikode</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 NSS MAMOC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};