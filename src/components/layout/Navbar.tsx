import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X, Home, Shirt, Sparkles, TrendingUp, FileText, ShoppingBag, BarChart3, LogIn, LogOut, Scan } from "lucide-react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/AuthDialog";
import "./navbar.css";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/wardrobe", label: "Wardrobe", icon: Shirt, tourClass: "wardrobe-link" },
  { path: "/outfits", label: "Outfits", icon: Sparkles, tourClass: "outfits-link" },
  { path: "/trends", label: "Trends", icon: TrendingUp, tourClass: "trends-link" },
  { path: "/content", label: "Content", icon: FileText, tourClass: "content-link" },
  { path: "/shopping", label: "Shopping", icon: ShoppingBag, tourClass: "shopping-link" },
  { path: "/tryon", label: "Try-On", icon: Scan, tourClass: "tryon-link" },
  { path: "/business", label: "Business", icon: BarChart3 },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const darkMode = theme === "dark";

  useOnClickOutside(menuRef, () => setIsOpen(false));

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const toggleTheme = () => {
    setTheme(darkMode ? "light" : "dark");
  };

  return (
    <nav className="navbar" ref={menuRef}>
      <div className="navbar-container">
        <NavLink to="/" className="logo" onClick={() => setIsOpen(false)}>
          Closet<span>AI</span>
        </NavLink>

        <div className="nav-menu-desktop">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""} ${"tourClass" in item ? item.tourClass : ""}`}
            >
              <item.icon className="nav-icon" size={18} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          {user ? (
            <button
              className="theme-toggle"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <button
              className="theme-toggle"
              onClick={() => setAuthOpen(true)}
              aria-label="Sign in"
              title="Sign in"
            >
              <LogIn size={20} />
            </button>
          )}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="nav-menu-mobile"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""} ${"tourClass" in item ? item.tourClass : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="nav-icon" size={18} />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
              {user ? (
                <button
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="nav-link"
                >
                  <LogOut className="nav-icon" size={18} />
                  <span className="nav-label">Sign out</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAuthOpen(true); setIsOpen(false); }}
                  className="nav-link"
                >
                  <LogIn className="nav-icon" size={18} />
                  <span className="nav-label">Sign in</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </nav>
  );
};

export default Navbar;
