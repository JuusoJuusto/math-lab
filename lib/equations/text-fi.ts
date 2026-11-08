import type { OperationKind } from "./operations";
import type { EngineText } from "./text-types";

const MINUS = "−";

/** "molemmille puolille lisätään 5": the operation as a subordinate clause ("kun ..."). */
function when(kind: OperationKind, amount: string): string {
  switch (kind) {
    case "add":
      return `molemmille puolille lisätään ${amount}`;
    case "subtract":
      return `molemmilta puolilta vähennetään ${amount}`;
    case "multiply":
      return `molemmat puolet kerrotaan luvulla ${amount}`;
    case "divide":
      return `molemmat puolet jaetaan luvulla ${amount}`;
  }
}

export const fi: EngineText = {
  times: "·",
  divide: ":",
  kindNames: { add: "Lisää", subtract: "Vähennä", multiply: "Kerro", divide: "Jaa" },
  modeNames: { balance: "Molemmat puolet", flip: "Siirrä termi", chain: "Käänteisoperaatiot" },

  phrase(kind, amount) {
    switch (kind) {
      case "add":
        return `lisää molemmille puolille ${amount}`;
      case "subtract":
        return `vähennä molemmilta puolilta ${amount}`;
      case "multiply":
        return `kerro molemmat puolet luvulla ${amount}`;
      case "divide":
        return `jaa molemmat puolet luvulla ${amount}`;
    }
  },

  speech(text) {
    return text
      .replace(/(\d|x)\/(\d)/g, "$1 jaettuna luvulla $2")
      .replace(/=/g, " on yhtä suuri kuin ")
      .replace(new RegExp(MINUS, "g"), " miinus ")
      .replace(/[×·]/g, " kertaa ")
      .replace(/[÷:]/g, " jaettuna luvulla ")
      .replace(/\|/g, " molemmille puolille: ")
      .replace(/\+/g, " plus ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s+/g, " ")
      .trim();
  },

  problems: {
    "variable-multiplier": {
      title: "Käytä tässä pelkkää lukua",
      message:
        "Jos kerrot tai jaat x:ää sisältävällä lausekkeella, ratkaisut voivat muuttua tai jopa kadota. Kerro tai jaa vain luvulla.",
    },
    "divide-by-zero": {
      title: "Nollalla ei voi jakaa",
      message: "Nollalla jakamisella ei ole tulosta, joten se ei ole koskaan sallittua. Valitse toinen luku.",
    },
    "multiply-by-zero": {
      title: "Nollalla kertominen hävittää tietoa",
      message:
        "Kun molemmat puolet kerrotaan nollalla, ne muuttuvat molemmat nollaksi, ja 0 = 0 pätee kaikilla x:n arvoilla. Yhtälö ei enää kertoisi x:stä mitään, joten tämä siirto ei ole sallittu.",
    },
    "too-large": {
      title: "Luvusta tulee liian suuri",
      message: "Tämän vaiheen luvut kasvaisivat liian suuriksi. Kokeile pienempää lukua.",
    },
    "not-equivalent": {
      title: "Se muuttaisi yhtälöä",
      message: "Tämä vaihe ei pitäisi molempia puolia tasapainossa, joten se ei ole sallittu.",
    },
  },

  check: {
    original: "Alkuperäinen yhtälö",
    replace: (value) => `Korvaa x luvulla ${value}`,
    multiplyFirst: "Laske ensin kertolaskut",
    workOut: "Laske kumpikin puoli",
  },

  tutor: {
    praise: ["Hyvä valinta!", "Aivan oikein!", "Se toimii!", "Hyvin huomattu!", "Hyvää ajattelua!"],
    dividedBy: (amount) => `jaettu luvulla ${amount}`,
    multipliedBy: (amount) => `kerrottu luvulla ${amount}`,

    cancelsVariable: (kind, amount, term) =>
      `Kun ${when(kind, amount)}, termi ${term} kumoutuu toiselta puolelta, ja x-termit jäävät nyt vain yhdelle puolelle.`,
    cancelsSubtracted: (attached, amount) =>
      `Termi ${attached} on vähennyslasku. Yhteenlasku kumoaa vähennyslaskun, joten ${MINUS} ${amount} ja + ${amount} kumoavat toisensa.`,
    cancelsAdded: (attached, amount) =>
      `Termi ${attached} on yhteenlasku. Vähennyslasku kumoaa yhteenlaskun, joten + ${amount} ja ${MINUS} ${amount} kumoavat toisensa.`,
    staysEqual: "Tämä pitää molemmat puolet yhtä suurina ja vie yhtälöä lähemmäs muotoa x = luku.",
    negativeNote: "Negatiivisella luvulla kertominen tai jakaminen vaihtaa jokaisen termin merkin.",
    orderNote:
      "Tässä toimii myös se, että kertominen tai jakaminen kumotaan ensin. Moni kumoaa ensin yhteen- tai vähennyslaskun, koska luvut pysyvät silloin yksinkertaisina.",
    undoDivide: (words, amount) =>
      `x on ${words}. Jakolasku kumoaa kertolaskun, joten kun jaat luvulla ${amount}, x jää yksin.`,
    undoMultiply: (words, amount) =>
      `x on ${words}. Kertolasku kumoaa jakolaskun, joten kun kerrot luvulla ${amount}, x jää yksin.`,
    simpler: "Tämä pitää molemmat puolet yhtä suurina ja yksinkertaistaa yhtälöä.",
    clearsFractions: (amount) =>
      `Luku ${amount} on pienin luku, johon jokainen nimittäjä sopii. Kun molemmat puolet kerrotaan luvulla ${amount}, jokaisesta murtoluvusta tulee kokonaisluku, ja puolet pysyvät yhtä suurina.`,

    solved: (value, sameAs) =>
      `x on yksin, joten x = ${value}${sameAs ? ` (${sameAs} tarkoittaa samaa kuin x = ${value})` : ""}. Tarkista vastaus sijoittamalla se alkuperäiseen yhtälöön.`,
    noSolution: (equation) =>
      `x on kadonnut, eikä ${equation} pidä koskaan paikkaansa. Yhtälö on identtisesti epätosi: mikään x:n arvo ei kelpaa, joten yhtälöllä ei ole ratkaisua.`,
    infinite: (equation) =>
      `x on kadonnut, ja ${equation} pitää aina paikkansa. Yhtälö on identtisesti tosi: kaikki x:n arvot kelpaavat, joten ratkaisuja on äärettömän monta.`,
    nextClear: "Seuraavaksi: yhtälössä on yhä murtolukuja. Kerro molemmat puolet yhteisellä nimittäjällä, niin ne häviävät.",
    nextCollect: "Seuraavaksi: x on yhä kummallakin puolella, joten kokoa x-termit yhdelle puolelle.",
    nextConstant: "Seuraavaksi: x-termiin on yhä lisätty tai siitä on vähennetty jokin luku. Kumoa se.",
    nextCoefficient: (words) => `Seuraavaksi: x on yhä ${words}. Kumoa se käänteisoperaatiolla.`,

    noChange: {
      title: "Tämä ei muuta mitään",
      message:
        "Nollan lisääminen tai vähentäminen sekä luvulla 1 kertominen tai jakaminen jättää yhtälön täsmälleen ennalleen. Valitse luku, joka vie x:ää lähemmäs sitä, että se on yksin.",
    },
    awkward: () => ({
      title: "Sallittu, mutta menee sotkuiseksi",
      message:
        "Siirto on sallittu, mutta se jättää murtolukuja. Kokonaisluvuilla on helpompi laskea. Kokeile siirtoa, joka pitää luvut kokonaislukuina; usein se tarkoittaa ensin x:ään lisätyn tai siitä vähennetyn luvun kumoamista.",
    }),
    wrongDirectionAdditive: () => ({
      title: "Melkein – kokeile vastakkaista laskutoimitusta",
      message:
        "Yhtälö pysyy tasapainossa, mutta tämä lisää ongelmaa sen sijaan että kumoaisi termin. Kumoa termi tekemällä päinvastoin kuin se tekee.",
    }),
    wrongDirectionMultiplicative: () => ({
      title: "Melkein – kokeile vastakkaista laskutoimitusta",
      message:
        "Yhtälö pysyy tasapainossa, mutta tämä tekee x:lle vielä enemmän sitä, mitä sille on jo tehty. Kertomisen kumoat jakamalla ja jakamisen kertomalla.",
    }),
    wrongTermNumber: {
      title: "Tarkista, mitä kumoat",
      message: "Kumoamasi termi on pelkkä luku ilman x:ää. Yritä uudelleen ilman x:ää.",
    },
    wrongTermVariable: {
      title: "Tarkista, mitä kumoat",
      message: "Poistettava termi sisältää x:n, joten käyttämäsi määrän täytyy sisältää myös x.",
    },
    wrongAmount: {
      title: "Oikea ajatus, eri luku",
      message:
        "Siirron laji on oikea, mutta luku ei ole se, joka on kiinni x:ssä, joten mikään ei kumoudu. Katso tarkasti, minkä luvun haluat poistaa.",
    },
    movesAway: (differentKind) => ({
      title: "Se vaikeuttaa tehtävää",
      message: `Yhtälö pysyy tasapainossa, mutta x on nyt kauempana siitä, että se olisi yksin. Mieti, mikä on kiinni x:ssä ja miten sen voi kumota${differentKind ? " – tarvitaan ehkä toisenlainen laskutoimitus" : ""}.`,
    }),
    noProgress: {
      title: "Tasapainossa, mutta ei auta",
      message:
        "Molemmat puolet ovat yhä yhtä suuret, mutta x ei ole sen lähempänä sitä, että se olisi yksin. Mieti, mikä on kiinni x:ssä ja mikä laskutoimitus sen kumoaa.",
    },

    hintClear1: "Yhtälössä on murtolukuja. Kokonaisluvuilla on helpompi laskea, joten poista ensin nimittäjät.",
    hintClear2: (amount) =>
      `Etsi luku, johon jokainen nimittäjä sopii. Pienin on ${amount}. Kerro molemmat puolet sillä, ja kerro jokainen termi.`,
    hintCollect1: "x on molemmilla puolilla. Kokoa ensin kaikki x-termit yhdelle puolelle yhtäsuuruusmerkkiä.",
    hintCollect2: (subtract) =>
      `Valitse yksi poistettava x-termi. Pienemmän poistaminen pitää jäljelle jäävän x-termin positiivisena. ${
        subtract
          ? "Se on lisätty omalla puolellaan, joten vähennä se molemmilta puolilta."
          : "Se on vähennetty omalla puolellaan, joten lisää se molemmille puolille."
      }`,
    hintConstant1:
      "Katso x:n puolta. Onko siellä luku, joka lisätään tai vähennetään? Se on tiellä, kun x:ää yritetään saada yksin.",
    hintConstant2: (subtracted, attached) =>
      subtracted
        ? `Luku vähennetään (${attached}). Vähennyslasku kumotaan yhteenlaskulla, joten käytä vastakkaista laskutoimitusta.`
        : `Luku lisätään (${attached}). Yhteenlasku kumotaan vähennyslaskulla, joten käytä vastakkaista laskutoimitusta.`,
    hintCoefficient1: "Nyt x on kerrottu tai jaettu jollakin luvulla. Mikä laskutoimitus kumoaa sen?",
    hintCoefficient2: (unitFraction, words) =>
      unitFraction
        ? `x on ${words}. Jakolasku kumotaan kertolaskulla, joten kerro molemmat puolet tällä luvulla.`
        : `x on ${words}. Kertolasku kumotaan jakolaskulla, joten jaa molemmat puolet tällä luvulla.`,
    worked: (phrase, left, right, howTo) => `Kokeile tätä: ${phrase}. Vasen puoli: ${left}. Oikea puoli: ${right}. ${howTo}`,
    howToEnter: (kindName, amount, withVariable) =>
      withVariable
        ? `Valitse ”${kindName}”, kirjoita ${amount} ja ota x-painike käyttöön.`
        : `Valitse ”${kindName}” ja kirjoita ${amount}.`,
    flipTip: (term, becomes) =>
      `Oikotie: napauta ”Siirrä termi” -tilassa termiä ${term}. Se siirtyy yhtäsuuruusmerkin toiselle puolelle muodossa ${becomes}.`,
  },

  session: {
    leftSide: (work) => `Vasen puoli: ${work}`,
    rightSide: (work) => `Oikea puoli: ${work}`,
    alone: "x on yksin!",
    noSolution: "Yhtälöllä ei ole ratkaisua",
    infinite: "Yhtälöllä on äärettömän monta ratkaisua",
    repeatedTitle: "Tämä on jo kokeiltu",
    repeatedBody: "Katso, mikä on kiinni x:ssä, tai käytä vihjepainiketta, jos haluat apua.",
    nowWeHave: (equation) => `Nyt meillä on ${equation}`,
  },

  prelude: {
    expandStage: "Poista sulut",
    simplifyStage: "Sievennä",
    expandQuestion: (part) => `Poista sulut lausekkeesta ${part}. Mitä saat?`,
    simplifyQuestion: (part) => `Sievennä ${part}. Mitä saat?`,
    expandRight: (part, result) =>
      `Jokainen sulkujen sisällä oleva termi kerrotaan sulkujen edessä olevalla luvulla: ${part} = ${result}.`,
    simplifyRight: (part, result) => `Yhdistä samanmuotoiset termit: ${part} = ${result}.`,
    wrongTitle: "Ei ihan",
    wrong: {
      "forgot-term": "Sulkujen edessä oleva luku kertoo jokaisen sulkujen sisällä olevan termin, ei vain yhtä.",
      sign: "Tarkista merkit: miinus kertaa plus on miinus, ja miinus kertaa miinus on plus.",
      denominators:
        "Murtolukuja ei lasketa yhteen laskemalla nimittäjät yhteen. Käytä yhteistä nimittäjää ja laske sitten osoittajat yhteen.",
      arithmetic: "Tarkista laskut: käy termit läpi yksi kerrallaan.",
    },
    done: "Yhtälö on nyt yksinkertaisessa muodossa. Ratkaise se.",
  },

  flip: {
    term: (term, becomes, bar, phrase) =>
      `Termi ${term} siirtyy yhtäsuuruusmerkin toiselle puolelle ja sen merkki vaihtuu: toisella puolella se on ${becomes}. Se on lyhennys: ${phrase}. Vihkoon se kirjoitetaan ${bar} yhtälön viereen. Vanhalla puolellaan termi kumoutuu.`,
    factorDivide: (factor) =>
      `Luku ${factor} kertoo x:ää, joten se siirtyy yhtäsuuruusmerkin toiselle puolelle jakajaksi: molemmat puolet jaetaan luvulla ${factor}.`,
    factorMultiply: (factor) =>
      `x on jaettu luvulla ${factor}, joten ${factor} siirtyy yhtäsuuruusmerkin toiselle puolelle kertojaksi: molemmat puolet kerrotaan luvulla ${factor}.`,
    movedLine: (moved) => `Siirron jälkeen: ${moved}`,
    sameAs: (bar) => `Sama kuin kirjoittaisi ${bar} yhtälön viereen`,
    notHelpfulTitle: "Sen siirtäminen ei vielä auta",
    notHelpful: (term) =>
      `Termin ${term} siirtäminen pitää yhtälön oikeana, mutta se ei vie x:ää lähemmäs sitä, että se olisi yksin. Etsi luku, joka on x:n tiellä.`,
  },

  written: {
    empty: { title: "Kirjoita ensin yhtälö", body: "Kirjoita tarinan antama yhtälö ja käytä etsittävälle luvulle merkintää x." },
    "no-equals": { title: "Yhtälössä tarvitaan yhtäsuuruusmerkki", body: "Laita = kahden yhtä suuren asian väliin, esimerkiksi 2x + 3 = 15." },
    "many-equals": { title: "Vain yksi yhtäsuuruusmerkki", body: "Yhtälössä on kaksi puolta ja niiden välissä yksi =." },
    "unknown-letter": { title: "Käytä tuntemattomalle merkintää x", body: "Kirjoita etsittävä luku x:nä. Muita kirjaimia ei käytetä tässä." },
    "not-linear": { title: "Tuossa on x kertaa x tai x jakajana", body: "Näissä tarinoissa x on yksinään, kerrottuna luvulla tai jaettuna luvulla." },
    unreadable: { title: "En ymmärrä tuota", body: "Tarkista sulut ja merkit. Kirjoita lukuja, x, + − · : ( ) ja yksi =." },
  },

  build: {
    exact: {
      title: "Se on oikea yhtälö!",
      body: "Se sanoo täsmälleen saman kuin tarina. Ratkaise nyt yhtälö, niin saat x:n.",
    },
    equivalent: {
      title: "Sekin käy",
      body: "Yhtälölläsi on sama ratkaisu kuin tarinalla, joten ratkaistaan sinun yhtälösi.",
    },
    answerGiven: {
      title: "Siinä x on jo yksin",
      body: "Kirjoita ensin tarinan antama yhtälö tarinan luvuilla. Ratkaiseminen tulee vasta sen jälkeen.",
    },
    noVariable: {
      title: "Yhtälössäsi ei ole x:ää",
      body: "Käytä x:ää etsittävälle luvulle ja kirjoita se yhtälöön.",
    },
    sign: {
      title: "Tarkista plus- ja miinusmerkit",
      body: "Lisätäänkö tarinassa jotain vai otetaanko jotain pois? Jokaisen luvun edessä olevan merkin pitää vastata tarinaa.",
    },
    swapped: {
      title: "Tarkista, mikä luku kuuluu x:n kanssa",
      body: "Luku, joka toistuu yhä uudelleen (jokaista kilometriä, viikkoa tai vihkoa kohden), kerrotaan x:llä. Luku, joka tapahtuu vain kerran, lisätään tai vähennetään erikseen.",
    },
    total: {
      title: "Tarkista kokonaismäärä",
      body: "Yhtälön toisen puolen pitäisi olla se, mitä tarina sanoo yhteensä. Vertaa yhtäsuuruusmerkin jälkeistä lukua tarinaan.",
    },
    general: {
      title: "Se ei vielä vastaa tarinaa",
      body: "Käy tarina läpi järjestyksessä: mikä on x? Mitä x:lle tapahtuu? Mikä on tulos? Kirjoita jokainen osa matematiikaksi.",
    },
  },
};
