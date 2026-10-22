# Kohderyhmät dashboardille + Pages-sivu overlayn kohteeksi

## Miksi

Rascal Adsissa tehty mainos ja Rascal Pagesilla tehty sivu eivät tiedä toisistaan. Overlay
personoi sivun kohderyhmittäin, mutta:

1. Kohderyhmät (`overlay_profiles`) ovat kannassa organisaatiotasolla, mutta niitä hallitaan
   yksittäisen overlay-sivuston alta. Niitä ei näe dashboardilta.
2. Overlay toimii vain ulkoisilla sivuilla, joille asennetaan snippet. Pagesilla tehtyä sivua ei
   voi valita kohteeksi.
3. Laskeutumissivun kohdennus vaatii, että käyttäjä kirjoittaa `utm_term`-arvon ja muistaa
   laittaa saman mainokseen.

## Tavoitteet

- **Kohderyhmät dashboardille**: oma näkymä `/app/dashboard/audiences`, linkki dashboardin
  headerista. Siellä luodaan, muokataan, poistetaan ja tuodaan (Rascal AI / CRM-segmentit).
  Jokaisesta ryhmästä näkyy, missä sitä käytetään: laskeutumissivut kampanjoineen, linkit
  editoriin.
- **Pages-sivu overlay-kohteeksi**: uuden kampanjan lomakkeessa valitaan "Oma Pages-sivu"
  (organisaation sivustot) tai "Ulkoinen sivusto" (URL kuten nyt). Pages-kohteelle ei näytetä
  snippetin asennusohjetta.
- **Pysyvät elementit Pages-sivulla**: julkinen renderöinti merkitsee jokaisen vapaan osion lohkon
  `data-rp-block="<id>"`. Overlay-editorin selektori ankkuroituu siihen, jolloin valinta säilyy,
  vaikka lohkoa siirretään.
- **Variantti palvelimella**: Pages-sivun palvelinrenderöinti valitsee laskeutumissivun ja
  variaation samoilla säännöillä kuin config-endpoint ja o.js, ja soveltaa muutokset
  sisältömalliin ennen renderöintiä. Sivu ei välähdä alkuperäisenä.
- **Automaattinen linkki**: uusi laskeutumissivu saa oman `rp`-tunnisteen. Editorissa näkyy valmis
  linkki ja "Kopioi linkki". Oma UTM-kohdennus säilyy lisäasetuksena (käynnissä olevat mainokset,
  Google Adsin `{keyword}` → `utm_term`).

## Ei tässä

- Ads-integraatio (kohdesivu-kenttä Adsiin). Tehdään Rascal AI -repossa myöhemmin; tämä työ
  tuottaa linkin, jota se käyttää.
- Erillinen varianttimalli Pages-editoriin. Personointi tehdään overlayn kautta.
- Kantamuutokset. Pages-kohde tunnistetaan `target_origin`ista (sivuston subdomain/custom domain).

## Anti-tavoitteet

- Toisen organisaation kampanja ei saa koskaan muuttaa sivua: palvelin hyväksyy vain kampanjat,
  joiden overlay-sivusto kuuluu samalle organisaatiolle kuin Pages-sivu.
- Julkinen sivu ei saa hidastua tai rikkoutua ilman kohdennusta: ilman osumaa ei tehdä mitään
  ylimääräistä renderöinnissä eikä ladata skriptiä.

## Ratkaisut

### Pages-sivun origin
`pagesSiteOrigin(site)` = `https://<custom_domain>` tai `https://<subdomain>.<NEXT_PUBLIC_ROOT_DOMAIN>`.
Kampanjan `target_origin` tallennetaan tällä. Sama funktio palvelinrenderöinnissä, joten
localhost-kehitys toimii (`test.localhost:3000` → sivuston subdomain).

### Editorin proxy Pages-kohteelle
Tuotannossa proxy hakee sivun HTTP:llä kuten ulkoisen sivun. Kehityksessä (`NODE_ENV=development`)
Pages-kohteen sivu haetaan `http://<subdomain>.localhost:3000`-osoitteesta ilman julkisen osoitteen
tarkistusta. Osoite muodostetaan omasta sivustorivistä, ei käyttäjän syötteestä.

### Selektori
`buildSelector` suosii lähintä `[data-rp-block]`-esivanhempaa ankkurina (kuten pysyvää id:tä).
Palvelin tunnistaa Pages-muutoksen selektorin alusta `[data-rp-block="<id>"]` ja kohdistaa sen
lohkon kenttään:

| Lohko | text | image | link | hide |
|---|---|---|---|---|
| text | `content.text` | – | – | poista lohko |
| image | – | `content.src` | – | poista lohko |
| button | `content.label` | – | `content.href` | poista lohko |
| component | – | – | – | poista lohko |

Sormenjälki (`original`) tarkistetaan kuten o.js:ssä (normalisoitu teksti / src / href); ei
täsmää → muutos ohitetaan. Muutokset, joita palvelin ei osaa kohdistaa, ohitetaan.

### Palvelinpuolen valinta ja tilastot
- Kohdennusparametrit: URL:n `utm_term/utm_campaign/utm_content/rp`, muuten eväste
  `rp_overlay_params` (sessio), jotta variantti säilyy sivulta toiselle.
- Kävijätunniste: eväste `rp_overlay_vid`; puuttuessa palvelin luo uuden. A/B-valinta
  `assignVariant(variants, vid, landingPageId)` – sama kuin o.js.
- Kun variantti on sovellettu, sivulle lisätään o.js "applied"-tilassa:
  `<script src=".../overlay/o.js" data-site=<overlay-sivusto> data-rp-applied=<variantId> data-rp-vid=<vid> data-rp-params=<json>>`.
  Se kirjoittaa evästeet, lähettää näyttötapahtuman ja konversion lomakkeen lähetyksestä.
  Ei hakua eikä DOM-muutoksia.

### Laskeutumissivun linkki
- Uusi laskeutumissivu: `match = { rp: <6 merkin koodi a-z0-9> }`.
- Laskeutumissivun editori: oletuksena "Linkki"-kenttä (`<origin><polku>?rp=<koodi>`, polun
  jokerimerkki → `/`) ja "Kopioi linkki". "Lisäasetukset" avaa nykyiset UTM-kentät; jos käyttäjä
  syöttää UTM-arvon, `rp` poistetaan kohdennuksesta (kaikkien avainten pitää täsmätä).
- Vanhat laskeutumissivut, joilla ei ole `rp`:tä: näytetään nykyinen kohdennus ja nappi
  "Luo linkki" (lisää `rp`:n vain, jos UTM-kenttiä ei ole).

### Kohderyhmät-näkymä
- `/app/dashboard/audiences`: `ProfilesClient` + käyttölistaus (laskeutumissivut, joilla
  `profile_id` = ryhmä, kampanjan nimi ja linkki laskeutumissivun editoriin).
- Vanha `/app/dashboard/[id]/overlay/profiles` ohjaa uuteen näkymään.
- Dashboardin headeriin linkki "Kohderyhmät"; overlay-näkymän nappi osoittaa uuteen reittiin.

### Rakentajan tarkistuksen jälkeen tehdyt ratkaisut (Clauden päätöksiä)
- **Useampi kampanja samalle Pages-sivulle**: palvelin hakee kaikki organisaation aktiiviset
  kampanjat, joiden origin on jokin sivuston origineista, ja valitsee `pickTarget`illa (tarkin
  kohdennus, sitten tuorein). `data-site` = valitun kampanjan overlay-sivusto.
- **Muutokset, joita palvelin ei osaa kohdistaa** (esim. footer tai komponentin sisältö),
  annetaan applied-tilan o.js:lle, joka soveltaa ne selaimessa kuten ulkoisella sivulla.
- **Sivuston kaikki originit**: vertailu tehdään sekä subdomain- että custom domain -originiin.
- **Jakolinkin esikatselu** (`?t=`) renderöidään Pages-sivulla palvelimella; tilastoja ei kirjata.
- **Editorin proxy** hakee sivun ilman evästeitä ja kohdennusparametreja, joten se saa aina
  alkuperäisen sivun.

## Valmis kun
- Kohderyhmiä voi hallita dashboardilta ja näkee niiden käytön.
- Overlay-kampanjan voi luoda Pages-sivulle, elementit valitaan editorissa ja `?rp=` -linkillä
  sivu renderöityy variantilla ilman välähdystä; näyttö ja konversio kirjautuvat tilastoihin.
- Uusi laskeutumissivu näyttää valmiin linkin; UTM-kohdennus toimii lisäasetuksena.
- Testit, tsc ja lint läpi.

## Rakentajan harkintaan
- Komponenttien ja tekstien tarkka ulkoasu, olemassa olevien UI-komponenttien mukaan.
- Koodin pituus ja tunnistekirjaimisto, kunhan törmäys on epätodennäköinen kampanjan sisällä.
