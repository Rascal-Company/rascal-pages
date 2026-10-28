import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getWaitlistCount } from "@/app/actions/waitlist";
import CampaignDemo from "./_components/CampaignDemo";
import TrialLink from "./_components/TrialLink";
import WaitlistForm from "./_components/WaitlistForm";
import styles from "./home.module.css";

// Jonon pituus päivittyy etusivulle viiden minuutin välein.
export const revalidate = 300;

// Pieni luku näyttäisi tyhjältä jonolta, joten pituus näytetään vasta tästä alkaen.
const MIN_COUNT_SHOWN = 50;

export const metadata: Metadata = {
  title: "Rascal Pages – laskeutumissivut, jotka puhuvat jokaiselle mainokselle",
  description:
    "Rakenna laskeutumissivut, blogi ja portfolio ilman koodia, personoi sisältö mainoskampanjan mukaan ja vie liidit suoraan Rascal CRM:ään. Liity jonoon.",
  openGraph: {
    title: "Rascal Pages",
    description:
      "Laskeutumissivut, blogi ja kampanjakohtainen personointi. Liidit suoraan Rascal CRM:ään.",
    locale: "fi_FI",
    type: "website",
  },
};

const PRICING_URL = "https://www.rascal.fi/hinnat";
const CONTACT_URL = "mailto:info@rascal.fi";

type Item = { title: string; body: string };

const STARTS: Item[] = [
  {
    title: "Kerro yrityksestäsi",
    body: "Kirjoita muutama lause siitä, mitä teet ja kenelle. AI tekee sivun valmiiksi. Portfolion voi tehdä myös puhumalla: vastaat haastattelijan kysymyksiin, ja vastauksista syntyy sivu projekteineen.",
  },
  {
    title: "Näytä sivu, josta pidät",
    body: "Anna enintään kolme osoitetta. AI rakentaa samantyylisen sivun ja täyttää tekstit Rascal AI -profiilistasi. Omasta nykyisestä sivustasi se voi käyttää myös tekstit ja kuvat.",
  },
  {
    title: "Valitse pohja tai tyhjä sivu",
    body: "Kahdeksan pohjaa e-kirjasta portfolioon, tai aloitat tyhjästä ja lisäät osiot itse.",
  },
];

const EDITOR_FEATURES: Item[] = [
  {
    title: "Lohkot minne haluat",
    body: "Teksti, kuva ja painike asettuvat 24 sarakkeen ruudukkoon. Raahaa, muuta kokoa kulmista ja muokkaa tekstiä suoraan sivulla.",
  },
  {
    title: "Valmiit osiot",
    body: "Lomake, UKK, hinnoittelu, galleria, suosittelut, logot, video, blogi ja projektit lisätään yhdellä valinnalla.",
  },
  {
    title: "Mobiili hoituu",
    body: "Mobiiliasettelu syntyy automaattisesti. Halutessasi järjestät sen itse mobiiliesikatselussa.",
  },
  {
    title: "Ei pelkoa virheistä",
    body: "Kumoa ja tee uudelleen, automaattinen tallennus ja esikatselu työpöydällä, tabletilla ja puhelimella ennen julkaisua.",
  },
];

const PERSONALIZATION: Item[] = [
  {
    title: "Kohdenna mainoksen mukaan",
    body: "Versio valitaan utm_campaign-, utm_content- tai utm_term-parametrin perusteella. Uusi laskeutumissivu saa valmiin mainoslinkin.",
  },
  {
    title: "Testaa A ja B",
    body: "Kävijät jaetaan variaatioille. Näet näytöt, kävijät ja konversiot variaatioittain.",
  },
  {
    title: "Personoi AI:lla",
    body: "AI kirjoittaa version kohderyhmälle: Rascal AI:n ihanneasiakkaalle, CRM-segmentille tai itse kuvaamallesi ryhmälle.",
  },
  {
    title: "Jaa ennen julkaisua",
    body: "Lähetä esikatselulinkki asiakkaalle tai tiimille ennen kuin variaatio menee mainoksiin.",
  },
];

const LEAD_STEPS: Item[] = [
  {
    title: "Kävijä täyttää lomakkeen",
    body: "Kentät, suostumukset ja kiitosviesti määritetään lomakkeessa. Roskapostibotit suodatetaan pois.",
  },
  {
    title: "Hän saa lahjansa heti",
    body: "Liitä lomakkeeseen e-kirja tai muu tiedosto. Lataus aukeaa lähetyksen jälkeen, ja linkki menee myös sähköpostiin.",
  },
  {
    title: "Liidi on CRM:ssä",
    body: "Yhteystieto tallentuu Rascal CRM:ään valitsemallasi tagilla, ja CRM:n automaatiot käynnistyvät. Liidit voi lähettää myös omaan webhookiin.",
  },
];

const PUBLISHING: Item[] = [
  {
    title: "Oma verkkotunnus",
    body: "Julkaise heti osoitteessa nimi.rascalpages.fi tai liitä oma domain. Saat DNS-ohjeet ja näet, milloin yhteys on valmis.",
  },
  {
    title: "Blogi hakukoneille",
    body: "Kirjoita postaukset editorissa tai julkaise ne rajapinnan kautta API-avaimella, esimerkiksi suoraan Rascal AI:sta.",
  },
  {
    title: "Monisivuinen sivusto",
    body: "Alasivut ja yhteinen navigaatio. Hakukoneotsikot, kuvaukset ja rakenteinen data sivukohtaisesti.",
  },
  {
    title: "Analytiikka",
    body: "Näytöt, liidit ja konversio sivustoittain. Lisää GA4, Google Tag Manager tai Meta Pixel tunnisteella.",
  },
];

const TEMPLATES = [
  { name: "E-kirja / Lead magnet", body: "Hyödyt ja lomake rinnakkain." },
  { name: "Odotuslista", body: "Yksi viesti ja iso sähköpostikenttä." },
  { name: "SaaS Modern", body: "Ominaisuudet, hinnoittelu ja UKK." },
  { name: "VSL", body: "Otsikko, video ja painike." },
  { name: "Personal", body: "Profiilikuva, tarina ja suosittelut." },
  { name: "Henkilöbrändi + blogi", body: "Esittely ja uusimmat kirjoitukset." },
  { name: "Portfolio", body: "Projektit, osaaminen ja yhteydenotto." },
  { name: "Mobiilisovellus / tuote", body: "Tuotteen esittely ja latauslinkit." },
];

const AUDIENCES: Item[] = [
  {
    title: "Yrittäjät ja pk-yritykset",
    body: "Laskeutumissivu jokaiselle kampanjalle ilman verkkotoimistoa. Lomakkeen liidit menevät suoraan myyntiin.",
  },
  {
    title: "Asiantuntijat ja konsultit",
    body: "Portfolio ja henkilöbrändisivu blogeineen. Löydyt hausta, ja yhteydenotot tulevat lomakkeelta.",
  },
  {
    title: "Rascal AI -käyttäjät",
    body: "Brändiprofiilisi, ihanneasiakkaasi ja kirjoittamasi sisältö ovat jo valmiina. Sivu, blogi ja liidit jatkavat samassa ketjussa.",
  },
  {
    title: "Markkinointitoimistot",
    body: "Personoi asiakkaan nykyinen sivusto kampanjoille ilman uudelleenrakennusta. Jaa esikatselu hyväksyttäväksi ja raportoi konversiot.",
  },
];

const FAQ = [
  {
    q: "Tarvitsenko koodaustaitoja?",
    a: "Et tarvitse. Sivut tehdään editorissa raahaamalla ja kirjoittamalla. Koodia tarvitaan vain, jos personoit muulla työkalulla tehtyä sivustoa: silloin sivulle lisätään yksi skriptirivi.",
  },
  {
    q: "Pitääkö sivuston olla tehty Rascal Pagesilla, jotta voin personoida sen?",
    a: "Ei tarvitse. Personointi toimii myös nykyisellä sivustollasi. Valitset muutettavat tekstit, kuvat ja linkit editorissa, joka näyttää sivustosi sellaisena kuin se on.",
  },
  {
    q: "Voinko käyttää omaa verkko-osoitettani?",
    a: "Voit. Sivu julkaistaan heti rascalpages.fi-alidomainissa, ja oman domainin liität asetuksista. Saat tarvittavan DNS-tietueen ja näet, milloin domain on aktiivinen.",
  },
  {
    q: "Tarvitsenko Rascal AI:n tai Rascal CRM:n?",
    a: "Rascal Pages toimii yksinään. Rascal AI:n kanssa AI saa käyttöönsä brändiprofiilisi ja ihanneasiakkaasi, ja Rascal CRM:n kanssa liidit siirtyvät suoraan myyntiin. Kirjaudut kaikkiin samalla Rascal ID:llä.",
  },
  {
    q: "Milloin Rascal Pages avataan?",
    a: "Avaamme Rascal Pagesin pian. Jonoon liittyneet pääsevät mukaan ensimmäisinä ja saavat ensimmäisen vuoden 40 % alennuksella.",
    pricingLink: false,
  },
];

// side-by-side: otsikko ja teksti rinnakkain (vain leveään palstaan).
function FeatureRows({ items, sideBySide = false }: { items: Item[]; sideBySide?: boolean }) {
  return (
    <dl className={`${styles.rows} m-0`}>
      {items.map((item) => (
        <div
          key={item.title}
          className={`grid gap-1.5 py-5 ${sideBySide ? "sm:grid-cols-[13rem_1fr] sm:gap-8" : ""}`}
        >
          <dt className={styles.h3}>{item.title}</dt>
          <dd className={`${styles.body} m-0`}>{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

// Kuvitus vapaasta osiosta: sarakeohjaimet ja yksi valittu lohko.
function EditorArt() {
  const blocks: { col: string; row: string; style?: CSSProperties; selected?: boolean }[] = [
    { col: "2 / 15", row: "1 / 3" },
    { col: "2 / 12", row: "4 / 5", style: { opacity: 0.6 } },
    { col: "2 / 10", row: "5 / 6", style: { opacity: 0.6 } },
    { col: "16 / 24", row: "1 / 8", style: { background: "#f6d9cb" }, selected: true },
    { col: "2 / 7", row: "7 / 8", style: { background: "var(--ink)" } },
    { col: "2 / 9", row: "10 / 14" },
    { col: "9 / 16", row: "10 / 14" },
    { col: "16 / 24", row: "10 / 14" },
  ];
  return (
    <div className={styles.gridArt} aria-hidden>
      <div className={styles.gridGuides}>
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      {blocks.map((b) => (
        <div
          key={`${b.col}-${b.row}`}
          className={`${styles.gridBlock} ${b.selected ? styles.selected : ""}`}
          style={{ gridColumn: b.col, gridRow: b.row, ...b.style }}
        />
      ))}
    </div>
  );
}

function VariantArt() {
  const variants = [
    { label: "Variaatio A", color: "var(--accent)", lines: ["78%", "56%"] },
    { label: "Variaatio B", color: "var(--variant-b)", lines: ["64%", "82%"] },
  ];
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden>
      {variants.map((v) => (
        <div key={v.label} className="rounded-2xl bg-white p-4 shadow-[0_0_0_1px_rgba(26,26,26,0.06)]">
          <span className={styles.variantTag}>
            <span className={styles.variantDot} style={{ background: v.color }} />
            {v.label}
          </span>
          <div className="mt-4 h-3 rounded-full bg-[#ece4dc]" style={{ width: v.lines[0] }} />
          <div className="mt-2 h-3 rounded-full bg-[#ece4dc]" style={{ width: v.lines[1] }} />
          <div className="mt-5 h-7 w-24 rounded-full" style={{ background: v.color }} />
        </div>
      ))}
    </div>
  );
}

export default async function Home() {
  const waitlistCount = await getWaitlistCount();
  const showCount = waitlistCount !== null && waitlistCount >= MIN_COUNT_SHOWN;

  return (
    <div className={`${styles.page} min-h-screen`}>
      <a
        href="#sisalto"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        Siirry sisältöön
      </a>

      <header className={styles.header}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className={`${styles.focusRing} whitespace-nowrap rounded text-[1.0625rem] font-semibold tracking-[-0.02em]`}>
            Rascal Pages
          </Link>
          <nav
            aria-label="Päävalikko"
            className="hidden items-center gap-7 text-[0.9375rem] text-[color:var(--ink-muted)] md:flex"
          >
            <a href="#aloitus" className="hover:text-[color:var(--ink)]">Aloitus</a>
            <a href="#personointi" className="hover:text-[color:var(--ink)]">Personointi</a>
            <a href="#liidit" className="hover:text-[color:var(--ink)]">Liidit</a>
            <a href="#kenelle" className="hover:text-[color:var(--ink)]">Kenelle</a>
            <a href={PRICING_URL} className="hover:text-[color:var(--ink)]">Hinnat</a>
          </nav>
          <div className="flex items-center gap-1">
            {/* Piilotus wrapperissa: .btn:n display ohittaisi Tailwindin hidden-luokan. */}
            <span className="hidden sm:contents">
              <TrialLink className={`${styles.btn} text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]`}>
                Kirjaudu
              </TrialLink>
            </span>
            <a href="#jono" className={`${styles.btn} ${styles.btnPrimary} whitespace-nowrap`}>
              Liity jonoon
            </a>
          </div>
        </div>
      </header>

      <main id="sisalto">
        <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div>
            <h1 className={styles.display}>Oma sivu jokaiselle mainokselle.</h1>
            <p className={`${styles.lead} mt-6`}>
              Tee laskeutumissivut, blogi ja portfolio ilman koodia. Näytä
              jokaiselle kampanjalle sille kirjoitettu viesti ja vie lomakkeen
              liidit suoraan Rascal CRM:ään.
            </p>
            <div id="jono" className="mt-9 scroll-mt-28">
              <WaitlistForm />
            </div>
            <p className="mt-5 text-sm text-[color:var(--ink-muted)]">
              Tulossa pian. Jonoon liittyneet saavat ensimmäisen vuoden −40 %.
              {showCount && ` Jonossa jo ${waitlistCount} ilmoittautunutta.`}
            </p>
          </div>
          <CampaignDemo />
        </section>

        <section id="aloitus" className="scroll-mt-20 border-t border-[color:var(--line)] bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
            <h2 className={`${styles.h2} max-w-[18em]`}>Aloita siitä, mitä sinulla jo on.</h2>
            <p className={`${styles.lead} mt-5`}>
              Ensimmäinen versio syntyy muutamassa minuutissa. Sen jälkeen
              muokkaat sitä kuten mitä tahansa sivua.
            </p>
            <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
              {STARTS.map((s) => (
                <div key={s.title} className="border-t-2 border-[color:var(--ink)] pt-5">
                  <h3 className={styles.h3}>{s.title}</h3>
                  <p className={`${styles.body} mt-3`}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1200px] items-start gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:py-28">
          <div className="lg:sticky lg:top-28">
            <EditorArt />
          </div>
          <div>
            <h2 className={styles.h2}>Muokkaa suoraan sivulla.</h2>
            <p className={`${styles.lead} mt-5`}>
              Mitä näet editorissa, sen kävijä näkee julkaistuna. Ei erillisiä
              lomakkeita tai sisällönhallintaa.
            </p>
            <div className="mt-10">
              <FeatureRows items={EDITOR_FEATURES} />
            </div>
          </div>
        </section>

        <section id="personointi" className="scroll-mt-20 bg-[#f5ede5]">
          <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-28">
            <div>
              <h2 className={styles.h2}>Personoi myös nykyinen sivustosi.</h2>
              <p className={`${styles.lead} mt-5`}>
                Sivustoa ei tarvitse rakentaa uudelleen. Lisää sivulle yksi
                skriptirivi, klikkaa muutettavaa tekstiä, kuvaa tai linkkiä ja
                kirjoita sille uusi versio. Kävijä näkee oikean version heti,
                ilman välähdystä.
              </p>
              <div className="mt-10">
                <VariantArt />
              </div>
            </div>
            <div className="lg:pt-2">
              <FeatureRows items={PERSONALIZATION} />
            </div>
          </div>
        </section>

        <section id="liidit" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <h2 className={`${styles.h2} max-w-[18em]`}>Liidi ei jää sähköpostiin odottamaan.</h2>
          <p className={`${styles.lead} mt-5`}>Lomakkeelta myyntiin ilman välivaiheita.</p>
          <ol className="mt-14 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-12">
            {LEAD_STEPS.map((step, i) => (
              <li key={step.title}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <h3 className={`${styles.h3} mt-5`}>{step.title}</h3>
                <p className={`${styles.body} mt-3`}>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-[color:var(--line)] bg-white">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-20 lg:py-28">
            <div>
              <h2 className={styles.h2}>Julkaise ja seuraa.</h2>
              <p className={`${styles.lead} mt-5`}>Kaikki, mitä sivu tarvitsee julkaisun jälkeen.</p>
            </div>
            <FeatureRows items={PUBLISHING} sideBySide />
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
          <h2 className={styles.h2}>Kahdeksan pohjaa.</h2>
          <p className={`${styles.lead} mt-5`}>
            Jokainen pohja on tavallinen sivu: vaihda osiot, värit ja fontit vapaasti.
          </p>
          <ul className="mt-12 grid list-none gap-x-10 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <li key={t.name} className="border-t border-[color:var(--line)] py-5">
                <p className="font-semibold tracking-[-0.01em]">{t.name}</p>
                <p className="mt-1 text-[0.9375rem] text-[color:var(--ink-muted)]">{t.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="kenelle" className="scroll-mt-20 border-t border-[color:var(--line)] bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
            <h2 className={styles.h2}>Kenelle Rascal Pages sopii.</h2>
            <div className="mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {AUDIENCES.map((a) => (
                <div key={a.title}>
                  <h3 className="text-[1.375rem] font-semibold leading-tight tracking-[-0.02em]">{a.title}</h3>
                  <p className={`${styles.body} mt-3 max-w-[34em]`}>{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="ukk" className="mx-auto max-w-[820px] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <h2 className={styles.h2}>Kysymyksiä</h2>
          <div className={`${styles.rows} mt-10 border-y border-[color:var(--line)]`}>
            {FAQ.map((item) => (
              <details key={item.q} className={styles.faq}>
                <summary className={`${styles.focusRing} flex items-center justify-between gap-6 rounded py-5`}>
                  <span className="text-[1.0625rem] font-semibold tracking-[-0.01em]">{item.q}</span>
                  <svg
                    className={`${styles.faqIcon} size-5 shrink-0 text-[color:var(--ink-muted)]`}
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M10 4v12M4 10h12" />
                  </svg>
                </summary>
                <p className={`${styles.body} pb-6 pr-10`}>
                  {item.a}
                  {item.pricingLink && (
                    <>
                      {" "}
                      <a href={PRICING_URL} className={styles.link}>
                        Avaa hinnasto
                      </a>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.dark}>
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
            <h2 className={`${styles.h2} max-w-[16em]`}>Pääse ensimmäisten joukkoon.</h2>
            <p className={`${styles.lead} mt-5`}>
              Avaamme Rascal Pagesin pian. Jonoon liittyneet pääsevät mukaan
              ensimmäisinä ja saavat ensimmäisen vuoden −40 %.
            </p>
            <div className="mt-9">
              <WaitlistForm tone="dark" />
            </div>
            <a
              href={CONTACT_URL}
              className={`${styles.btn} mt-6 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]`}
            >
              Kysy lisää
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--line)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 text-sm text-[color:var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Rascal Pages on osa Rascal-tuoteperhettä.</p>
          <nav aria-label="Alavalikko" className="flex flex-wrap gap-x-6 gap-y-2">
            <a href={PRICING_URL} className="hover:text-[color:var(--ink)]">Hinnat</a>
            <a href="https://www.rascal.fi" className="hover:text-[color:var(--ink)]">Rascal AI</a>
            <a href={CONTACT_URL} className="hover:text-[color:var(--ink)]">info@rascal.fi</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
