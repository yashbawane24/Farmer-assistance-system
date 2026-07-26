import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  badge: string;
  socials: {
    linkedin: string;
    github: string;
    email: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    name: 'Manthan T',
    role: 'Frontend Developer & UI/UX Designer',
    description: 'Designed and developed the complete user interface, responsive layouts, accessibility features, and user-centered experience for the Smart Farmer Assistance System.',
    image: '/team/manthan.jpg',
    badge: 'Frontend',
    socials: {
      linkedin: 'https://linkedin.com/',
      github: 'https://github.com/',
      email: 'mailto:manthan@example.com'
    }
  },
  {
    name: 'Yash Bawane',
    role: 'Backend Developer',
    description: 'Developed secure backend APIs, authentication, database integration, business logic, and server-side functionality to power the Smart Farmer Assistance System.',
    image: '/team/yash.jpg',
    badge: 'Backend',
    socials: {
      linkedin: 'https://linkedin.com/',
      github: 'https://github.com/',
      email: 'mailto:yashbawane24@gmail.com'
    }
  },
  {
    name: 'Rohit Kundu',
    role: 'Deployment & Testing Engineer',
    description: 'Managed deployment, application testing, cloud hosting, GitHub integration, debugging, and performance optimization to ensure a reliable user experience.',
    image: '/team/rohit.jpg',
    badge: 'Deployment',
    socials: {
      linkedin: 'https://linkedin.com/',
      github: 'https://github.com/',
      email: 'mailto:rohit@example.com'
    }
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 80, damping: 15 }
  }
};

const TeamSection: React.FC = () => {
  return (
    <section 
      id="meet-our-team" 
      className="relative overflow-hidden bg-white py-24 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/40"
      aria-labelledby="team-heading"
    >
      {/* Premium Green Gradients backdrop */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              ⚡ Creative Minds
            </span>
            <h2 id="team-heading" className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Meet Our Team
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              The passionate developers behind the Smart Farmer Assistance System, dedicated to empowering farmers through technology.
            </p>
          </motion.div>
        </div>

        {/* Cards Layout - Updated to 3 columns on desktop */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-150px' }}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
        >
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ 
                y: -10, 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
              }}
              className="group relative flex flex-col items-center justify-between text-center bg-white/40 dark:bg-slate-800/40 p-6 rounded-[20px] shadow-sm border border-slate-100 dark:border-slate-850 backdrop-blur-md transition-all duration-300 overflow-hidden"
            >
              {/* Custom Badge in top right corner */}
              <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-emerald-200/30 tracking-wider">
                {member.badge}
              </span>

              {/* Card top border glow on hover */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex flex-col items-center w-full">
                {/* Profile Image Container with Glow */}
                <div className="relative mb-6 mt-2">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-100 group-hover:scale-105 blur-md transition-all duration-300" />
                  <div className="relative h-28 w-28 rounded-full p-1 border-2 border-slate-200 dark:border-slate-700 group-hover:border-emerald-500 transition-colors duration-300 shadow-inner">
                    <img 
                      src={member.image} 
                      alt={`Portrait of ${member.name}`} 
                      className="h-full w-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                </div>

                {/* Details */}
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 mb-4 uppercase tracking-wider">
                  {member.role}
                </p>
                <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed px-2">
                  {member.description}
                </p>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100/60 dark:border-slate-750/40 w-full justify-center">
                <motion.a 
                  href={member.socials.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={`${member.name}'s LinkedIn Profile`}
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </motion.a>
                
                <motion.a 
                  href={member.socials.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`${member.name}'s GitHub Profile`}
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </motion.a>
                
                <motion.a 
                  href={member.socials.email}
                  aria-label={`Send Email to ${member.name}`}
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Message */}
        <div className="mt-20 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block bg-gradient-to-r from-emerald-50 via-green-50/50 to-emerald-50 border border-emerald-100/50 rounded-2xl px-8 py-5 dark:from-slate-800/40 dark:via-slate-800/20 dark:to-slate-800/40 dark:border-slate-800"
          >
            <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 italic">
              "Together, we are building technology that makes farming smarter, simpler, and more accessible."
            </p>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default TeamSection;
