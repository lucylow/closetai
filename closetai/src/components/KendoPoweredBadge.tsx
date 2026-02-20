import { motion } from "framer-motion";

export function KendoPoweredBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6E4AE0] to-[#9f7ef5] text-white rounded-full text-sm font-medium shadow-lg"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="4" fill="white" fillOpacity="0.2"/>
        <path d="M6 6h5v5H6V6zm7 0h5v5h-5V6zM6 13h5v5H6v-5zm7 0h5v5h-5v-5z" fill="white"/>
      </svg>
      Built with Progress KendoReact Enterprise
      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">v12.0.1</span>
    </motion.div>
  );
}

export function KendoFloatingBadge() {
  return (
    <div className="fixed bottom-4 right-20 z-50 flex items-center gap-2 bg-white dark:bg-gray-900 shadow-lg border border-border/50 px-3 py-1.5 rounded-full text-xs text-muted-foreground opacity-80 hover:opacity-100 transition-opacity">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="4" fill="#6E4AE0"/>
        <path d="M6 6h5v5H6V6zm7 0h5v5h-5V6zM6 13h5v5H6v-5zm7 0h5v5h-5v-5z" fill="white"/>
      </svg>
      Powered by Progress KendoReact
    </div>
  );
}
