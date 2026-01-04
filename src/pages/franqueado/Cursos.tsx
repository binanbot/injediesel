import { GraduationCap, PlayCircle, BookOpen, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Cursos() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        {/* Icon cluster */}
        <div className="relative mb-8 flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative"
          >
            <div className="w-24 h-24 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <GraduationCap className="w-12 h-12 text-primary" />
            </div>
            
            {/* Floating icons */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute -left-8 -top-4 w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/30"
            >
              <PlayCircle className="w-5 h-5 text-muted-foreground" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -right-8 -top-2 w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/30"
            >
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute -right-6 -bottom-4 w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/30"
            >
              <Award className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Em breve
          </h1>
          <p className="text-xl text-primary font-semibold mb-4">
            Cursos Online Injediesel
          </p>
          <p className="text-muted-foreground">
            Estamos preparando uma plataforma completa de cursos EAD para você evoluir e conquistar novas certificações.
          </p>
        </motion.div>

        {/* Progress teaser */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border/30"
        >
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Progresso do desenvolvimento</span>
            <span className="text-primary font-medium">75%</span>
          </div>
          <div className="h-2 bg-background/50 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
