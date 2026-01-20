'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoginModal from '@/app/components/LoginModal';

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-brand-light via-brand-beige to-brand-light">
        {/* Header/Navigation */}
        <header className="bg-brand-dark sticky top-0 z-50 shadow-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-white">Rascal Pages</h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link href="#features" className="text-white/70 hover:text-white transition-colors">
                  Ominaisuudet
                </Link>
                <Link href="#templates" className="text-white/70 hover:text-white transition-colors">
                  Mallit
                </Link>
                <Link href="#faq" className="text-white/70 hover:text-white transition-colors">
                  UKK
                </Link>
              </nav>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand-accent-hover"
                >
                  Kirjaudu sisään
                </button>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Aloita ilmaiseksi
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section id="hero" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-brand-dark sm:text-6xl lg:text-7xl">
              Luo konvertoiva landing page alle 60 sekunnissa
            </h1>
            <p className="mt-6 text-xl leading-8 text-brand-dark/70 max-w-3xl mx-auto">
              Unohda raskaat verkkosivutyökalut ja koodaaminen. Rascal Pages on tehty yrittäjille, jotka haluavat tuloksia heti – ei viikon päästä. Valitse pohja, kirjoita sisältö ja julkaise.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-lg bg-brand-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-brand-accent-hover hover:shadow-xl"
              >
                Rakenna sivustosi nyt →
              </button>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-lg border border-brand-accent px-8 py-4 text-lg font-semibold text-brand-accent transition-all hover:bg-brand-accent/10"
              >
                Aloita ilmaiseksi
              </button>
            </div>
            <p className="mt-4 text-sm text-brand-dark/60">
              Ei vaadi luottokorttia aloitukseen
            </p>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
              Miksi tuhlata päiviä, kun voit käyttää minuutteja?
            </h2>
            <p className="mt-6 text-lg leading-8 text-brand-dark/70">
              Useimmat sivustorakentajat ovat täynnä turhia ominaisuuksia, jotka vain hidastavat sinua. Rascal Pages karsii kohinan pois. Olemme keskittyneet olennaiseen: siihen, että saat ideasi julki ja alat kerätä asiakkaita ennätysajassa.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-brand-highlight/50">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl mb-16">
              Salamannopea sivustorakentaja
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-brand-accent/10 p-3">
                    <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Salamannopea editori
                </h3>
                <p className="text-sm text-brand-dark/70">
                  Näet muutokset reaaliajassa. Ei monimutkaisia valikoita, vaan intuitiivinen tapa muokata tekstejä, värejä ja kuvia.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-brand-accent/10 p-3">
                    <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Konversio-optimoidut pohjat
                </h3>
                <p className="text-sm text-brand-dark/70">
                  Älä arvaile, mikä toimii. Pohjamme on suunniteltu ohjaamaan kävijä kohti ostopäätöstä tai yhteydenottoa.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-brand-accent/10 p-3">
                    <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Julkaise omalla domainilla
                </h3>
                <p className="text-sm text-brand-dark/70">
                  Käytä ilmaista rascalpages.fi -alihakemistoa tai liitä oma domainisi (tulossa) ammattimaista lopputulosta varten.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-brand-accent/10 p-3">
                    <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Täysin mobiilioptimoitu
                </h3>
                <p className="text-sm text-brand-dark/70">
                  Sivustosi näyttävät upeilta kaikilla laitteilla automaattisesti. Ei erillistä mobiilisäätöä.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl mb-16">
              Valmis pohja jokaiseen tarpeeseen
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-brand-accent/10 p-2">
                    <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark">SaaS & Startupit</h3>
                </div>
                <p className="text-sm text-brand-dark/70">
                  Moderni pohja tuotteesi esittelyyn. Ominaisuudet, hinnoittelu ja UKK valmiina rakenteena.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-brand-accent/10 p-2">
                    <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark">Lead Magnet / E-kirjat</h3>
                </div>
                <p className="text-sm text-brand-dark/70">
                  Kerää sähköposteja tehokkaasti. Vasemmalla hyödyt, oikealla lomake – klassinen ja toimiva asettelu.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-brand-accent/10 p-2">
                    <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark">Odotuslistat (Waitlist)</h3>
                </div>
                <p className="text-sm text-brand-dark/70">
                  Testaa ideaasi ennen tuotteen rakentamista. Minimalistinen sivu, joka maksimoi kiinnostuksen.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-brand-accent/10 p-2">
                    <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark">Personal Branding</h3>
                </div>
                <p className="text-sm text-brand-dark/70">
                  Rakenna asiantuntijabrändiäsi. Tyylikäs pohja biolle, referensseille ja yhteydenotoille.
                </p>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-brand-accent/10 p-2">
                    <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark">VSL (Video Sales Letter)</h3>
                </div>
                <p className="text-sm text-brand-dark/70">
                  Anna videon myydä puolestasi. Yksinkertainen rakenne, joka pitää huomion videossa ja CTA-napissa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-brand-highlight/50">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
              Rakennettu modernilla teknologialla
            </h2>
            <p className="mt-6 text-lg leading-8 text-brand-dark/70">
              Rascal Pages on salamannopea ja turvallinen. Sivustosi latautuvat välittömästi Next.js-teknologian ansiosta, missä päin maailmaa tahansa.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl text-center mb-16">
              Usein kysytyt kysymykset
            </h2>
            <div className="space-y-8">
              <div className="border-b border-brand-dark/10 pb-8">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Tarvitsenko koodaustaitoja?
                </h3>
                <p className="text-brand-dark/70">
                  Et tarvitse. Jos osaat käyttää tekstinkäsittelyohjelmaa, osaat käyttää Rascal Pagesia.
                </p>
              </div>
              <div className="border-b border-brand-dark/10 pb-8">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Mitä "konversio-optimoitu" tarkoittaa?
                </h3>
                <p className="text-brand-dark/70">
                  Se tarkoittaa, että sivupohjat on suunniteltu siten, että ne ohjaavat kävijää tekemään halutun toiminnon (esim. tilaamaan uutiskirjeen tai ostamaan tuotteen), sen sijaan että ne olisivat vain "nättejä".
                </p>
              </div>
              <div className="border-b border-brand-dark/10 pb-8">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Voinko käyttää omaa verkko-osoitettani?
                </h3>
                <p className="text-brand-dark/70">
                  Kyllä. Voit julkaista sivun heti ilmaisella alidomainilla tai liittää oman www-osoitteesi palveluun.
                </p>
              </div>
              <div className="border-b border-brand-dark/10 pb-8">
                <h3 className="text-lg font-semibold text-brand-dark mb-2">
                  Onko tämä osa Rascal AI:ta?
                </h3>
                <p className="text-brand-dark/70">
                  Kyllä, Rascal Pages on osa Rascal AI -ekosysteemiä, suunniteltu helpottamaan digitaalista markkinointia ja myyntiä.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-brand-dark text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ideasta valmiiksi sivuksi tänään
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/80">
              Älä anna teknologian olla esteenä menestyksellesi. Luo ensimmäinen sivusi täysin ilmaiseksi.
            </p>
            <div className="mt-10">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-lg bg-brand-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-brand-accent-hover hover:shadow-xl"
              >
                Aloita nyt →
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-brand-dark/10 bg-brand-highlight/30 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-sm text-brand-dark/60">
                  © {new Date().getFullYear()} Rascal Pages / Rascal AI
                </p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">
                  Tietosuoja
                </Link>
                <Link href="#" className="text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">
                  Käyttöehdot
                </Link>
                <Link href="#" className="text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">
                  Ota yhteyttä
                </Link>
              </div>
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
