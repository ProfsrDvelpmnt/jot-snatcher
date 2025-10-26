import React, { useState, useRef, useEffect } from 'react';
import { supabaseAuth } from '../services/supabaseAuth';
import { AdminLoginForm } from './AdminLoginForm';

interface DraggableLoginFormProps {
  onLoginSuccess?: () => void;
  onResetSignOutFlag?: () => void;
}

export const DraggableLoginForm: React.FC<DraggableLoginFormProps> = ({ 
  onLoginSuccess, 
  onResetSignOutFlag 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  // Center the login form on mount
  useEffect(() => {
    const centerX = (window.innerWidth - 400) / 2; // Assuming form width ~400px
    const centerY = (window.innerHeight - 500) / 2; // Assuming form height ~500px
    setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === dragRef.current || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = dragRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 400; // Form width
      const maxY = window.innerHeight - 500; // Form height
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send sign in request to background script
      const result = await chrome.runtime.sendMessage({
        type: 'SIGN_IN',
        email,
        password
      });
      
      if (result && result.success) {
        console.log('✅ Login successful');
        onResetSignOutFlag?.(); // Reset the explicit sign-out flag
        onLoginSuccess?.();
      } else {
        setError(result?.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      setError('Login failed. Please try again.');
    }
    
    setLoading(false);
  };

  // Show admin login form if requested
  if (showAdminLogin) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div 
          ref={dragRef}
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <AdminLoginForm 
            onLoginSuccess={onLoginSuccess}
            onBackToRegular={() => setShowAdminLogin(false)}
            onResetSignOutFlag={onResetSignOutFlag}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full bg-white dark:bg-gray-800 flex flex-col"
    >
      {/* Fixed Header */}
      <div className="bg-terracotta text-white p-4 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={chrome.runtime.getURL('icons/spjot-48.png')} 
              alt="JOT Snatcher" 
              className="w-6 h-6 mr-2"
            />
            <h2 className="text-lg font-bold">
              Sign In to JOT Snatcher
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-terracotta dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-terracotta dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta hover:bg-terracotta/90 disabled:bg-terracotta/50 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAdminLogin(true)}
              disabled={loading}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline font-medium"
            >
              🔐 Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
