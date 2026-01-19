'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from './components/LoginModal';

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-brand-light via-brand-beige to-brand-light">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            {/* Logo/Brand */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight text-brand-dark sm:text-6xl lg:text-7xl">
                Rascal Pages
              </h1>
              <p className="mt-4 text-xl text-brand-dark/70">
                Rakenna kaunis landing page minuutissa
              </p>
            </div>

            {/* Hero Content */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-brand-dark sm:text-4xl">
                Helppokäyttöinen sivustorakentaja
              </h2>
              <p className="mt-6 text-lg leading-8 text-brand-dark/70">
                Luo ammattimaisia landing pageja ilman koodaamista. Valitse template, 
                muokkaa sisältöä ja julkaise heti.
              </p>
            </div>

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="rounded-lg bg-white/50 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4 text-4xl">⚡</div>
                <h3 className="text-lg font-semibold text-brand-dark">
                  Nopea käyttöönotto
                </h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Aloita minuuteissa. Ei vaadi monimutkaista konfigurointia.
                </p>
              </div>
              <div className="rounded-lg bg-white/50 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4 text-4xl">🎨</div>
                <h3 className="text-lg font-semibold text-brand-dark">
                  Valmiit templatet
                </h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Valitse sopiva template ja muokkaa sisältöä tarpeisiisi.
                </p>
              </div>
              <div className="rounded-lg bg-white/50 p-6 shadow-sm backdrop-blur-sm">
                <div className="mb-4 text-4xl">🚀</div>
                <h3 className="text-lg font-semibold text-brand-dark">
                  Julkaise heti
                </h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Sivu on julkaistu heti kun olet valmis. Ei odotusaikoja.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-16">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-lg bg-brand-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-brand-accent/90 hover:shadow-xl hover:scale-105"
              >
                Kirjaudu sisään
              </button>
              <p className="mt-4 text-sm text-brand-dark/60">
                Aloita luomalla ensimmäinen sivustosi
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-brand-dark/10 bg-white/30 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm text-brand-dark/60">
                &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet pidätetään.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
