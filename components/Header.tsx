'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">雨</span>
          </div>
          <span
            className={`text-2xl font-bold transition-colors ${
              isScrolled ? 'text-blue-600' : 'text-white'
            }`}
          >
            雨漏りドクター
          </span>
        </Link>
        <nav className="hidden md:flex space-x-6">
          <a
            href="#features"
            className={`transition-colors ${
              isScrolled
                ? 'text-gray-600 hover:text-blue-600'
                : 'text-white hover:text-blue-200'
            }`}
          >
            サービス
          </a>
          <a
            href="#how-it-works"
            className={`transition-colors ${
              isScrolled
                ? 'text-gray-600 hover:text-blue-600'
                : 'text-white hover:text-blue-200'
            }`}
          >
            診断の流れ
          </a>
          <a
            href="#stats"
            className={`transition-colors ${
              isScrolled
                ? 'text-gray-600 hover:text-blue-600'
                : 'text-white hover:text-blue-200'
            }`}
          >
            実績
          </a>
        </nav>
      </div>
    </header>
  );
}
