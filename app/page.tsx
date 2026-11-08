"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Home, Lightbulb, ListChecks, Menu, RotateCcw, Sparkles, Target, Trophy, X } from "lucide-react";

type Question = {
  id: string;
  topic: string;
  level: "Helppo" | "Keskitaso" | "Haastava";
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type Topic = { id: string; title: string; subtitle: string; colour: string; icon: string; description: string; lesson: string[] };

const topics: Topic[] = [
  { id: "basics", title: "Yhtälön idea", subtitle: "Mitä yhtäsuuruus tarkoittaa?", colour: "blue", icon: "⚖️", description: "Tutustu yhtälöön ja siihen, miten tuntematon selvitetään.", lesson: ["Yhtälössä vasen ja oikea puoli ovat yhtä suuria.", "Kirjain, esimerkiksi x, tarkoittaa tuntematonta lukua.", "Yhtälö pysyy tasapainossa, kun teet saman laskutoimituksen molemmille puolille.", "Tavoitteena on saada x yksin toiselle puolelle."] },
  { id: "simple", title: "Yksinkertaiset yhtälöt", subtitle: "Ratkaise x askel kerrallaan", colour: "green", icon: "🔎", description: "Harjoittele yhteen-, vähennys-, kerto- ja jakolaskua yhtälöissä.", lesson: ["Poista x:n vieressä oleva yhteenlaskettava vähentämällä se molemmilta puolilta.", "Jos x kerrotaan luvulla, jaa yhtälön molemmat puolet tällä luvulla.", "Tarkista ratkaisu sijoittamalla saamasi luku alkuperäiseen yhtälöön."] },
  { id: "both", title: "x molemmilla puolilla", subtitle: "Kokoa x:t yhteen", colour: "orange", icon: "↔️", description: "Siirrä muuttujatermit samalle puolelle ja luvut toiselle.", lesson: ["Valitse puoli, jolle haluat jättää x:n.", "Vähennä x-termi molemmilta puolilta tai siirrä se vastakkaiselle puolelle vastalaskulla.", "Laske samanlaiset termit yhteen ja ratkaise jäljelle jäänyt yhtälö."] },
  { id: "brackets", title: "Sulut yhtälöissä", subtitle: "Avaa sulut oikein", colour: "purple", icon: "( )", description: "Harjoittele osittelulakia ja sulkeiden poistamista.", lesson: ["Kerro sulkeiden sisällä olevat kaikki termit sulkeiden edessä olevalla luvulla.", "Esimerkiksi 3(x + 2) = 3x + 6.", "Ratkaise tämän jälkeen yhtälö tavalliseen tapaan."] },
  { id: "proportion", title: "Verrannollisuus", subtitle: "Suureet muuttuvat yhdessä", colour: "pink", icon: "📈", description: "Ymmärrä suora ja kääntäen verrannollisuus.", lesson: ["Suorassa verrannollisuudessa molemmat suureet kasvavat tai pienenevät samassa suhteessa.", "Kääntäen verrannollisuudessa toisen suureen kasvaessa toinen pienenee vastaavasti.", "Suorassa verrannollisuudessa suhde y/x pysyy vakiona."] },
  { id: "word", title: "Sanalliset tehtävät", subtitle: "Muuta teksti yhtälöksi", colour: "teal", icon: "💬", description: "Muodosta yhtälö arjen tilanteista ja ratkaise se.", lesson: ["Lue tehtävä ja päätä, mitä tuntematon x tarkoittaa.", "Muodosta tekstin tiedoista yhtälö.", "Ratkaise yhtälö ja vastaa kysymykseen kokonaisella lauseella.", "Tarkista, että vastaus sopii tehtävän tilanteeseen."] }
];

const questions: Question[] = [
  { id:"q1", topic:"simple", level:"Helppo", prompt:"Ratkaise yhtälö:  x + 7 = 15", choices:["x = 8","x = 22","x = 7","x = 9"], answer:"x = 8", explanation:"Vähennä molemmilta puolilta 7: x = 15 − 7 = 8." },
  { id:"q2", topic:"simple", level:"Helppo", prompt:"Ratkaise yhtälö:  4x = 28", choices:["x = 24","x = 7","x = 32","x = 6"], answer:"x = 7", explanation:"Jaa molemmat puolet neljällä: x = 28 / 4 = 7." },
  { id:"q3", topic:"simple", level:"Helppo", prompt:"Ratkaise yhtälö:  x − 9 = 4", choices:["x = −5","x = 13","x = 36","x = 5"], answer:"x = 13", explanation:"Lisää molemmille puolille 9: x = 4 + 9 = 13." },
  { id:"q4", topic:"both", level:"Keskitaso", prompt:"Ratkaise yhtälö:  5x + 2 = 3x + 12", choices:["x = 5","x = 7","x = 10","x = 2"], answer:"x = 5", explanation:"Vähennä 3x ja 2: 2x = 10. Jaa kahdella: x = 5." },
  { id:"q5", topic:"both", level:"Keskitaso", prompt:"Ratkaise yhtälö:  7x − 4 = 4x + 11", choices:["x = 3","x = 5","x = 7","x = 15"], answer:"x = 5", explanation:"Vähennä 4x ja lisää 4: 3x = 15. Siis x = 5." },
  { id:"q6", topic:"brackets", level:"Keskitaso", prompt:"Ratkaise yhtälö:  2(x + 3) = 18", choices:["x = 6","x = 9","x = 12","x = 3"], answer:"x = 6", explanation:"Avaa sulut: 2x + 6 = 18. Vähennä 6 ja jaa kahdella: x = 6." },
  { id:"q7", topic:"brackets", level:"Haastava", prompt:"Ratkaise yhtälö:  3(x − 2) = 2x + 5", choices:["x = 9","x = 11","x = 7","x = 1"], answer:"x = 11", explanation:"Avaa sulut: 3x − 6 = 2x + 5. Vähennä 2x ja lisää 6: x = 11." },
  { id:"q8", topic:"proportion", level:"Helppo", prompt:"2 kg omenoita maksaa 6 €. Paljonko 5 kg maksaa samalla kilohinnalla?", choices:["10 €","12 €","15 €","18 €"], answer:"15 €", explanation:"Yksi kilo maksaa 6 € / 2 = 3 €. Viisi kiloa maksaa 5 · 3 € = 15 €." },
  { id:"q9", topic:"proportion", level:"Keskitaso", prompt:"Kartalla 1 cm vastaa 4 km. Kuinka pitkää matkaa 3,5 cm vastaa?", choices:["7 km","12 km","14 km","16 km"], answer:"14 km", explanation:"Matka on suorassa verrannollisuudessa kartan pituuteen: 3,5 · 4 km = 14 km." },
  { id:"q10", topic:"word", level:"Keskitaso", prompt:"Kolme samanlaista kynää maksaa yhteensä 6 €. Mikä on yhden kynän hinta?", choices:["1 €","2 €","3 €","6 €"], answer:"2 €", explanation:"Merkitään yhden kynän hintaa x: 3x = 6. Jakamalla kolmella saadaan x = 2 €." },
  { id:"q11", topic:"basics", level:"Helppo", prompt:"Mikä seuraavista on yhtälö?", choices:["3x + 2","3x + 2 = 11","x > 4","2 + 5"], answer:"3x + 2 = 11", explanation:"Yhtälössä on yhtäsuuruusmerkki ja kaksi yhtä suurta lauseketta." },
  { id:"q12", topic:"proportion", level:"Haastava", prompt:"4 työntekijää tekee työn 12 tunnissa. Kuinka kauan 8 työntekijältä kestää sama työ samalla teholla?", choices:["3 tuntia","6 tuntia","12 tuntia","24 tuntia"], answer:"6 tuntia", explanation:"Työntekijöiden määrä ja aika ovat kääntäen verrannollisia. Työntekijöitä on kaksinkertainen määrä, joten aika puolittuu: 12 / 2 = 6 tuntia." }
];

const STORAGE_KEY = "mathlab:progress:v1";

export default function HomePage() {
  const [view, setView] = useState<"home"|"topics"|"lesson"|"quiz"|"progress">("home");
  const [activeTopic, setActiveTopic] = useState("simple");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { completed?: string[]; attempts?: number; correct?: number };
        setCompleted(Array.isArray(data.completed) ? data.completed : []);
        setAttempts(Number.isFinite(data.attempts) ? Number(data.attempts) : 0);
        setCorrect(Number.isFinite(data.correct) ? Number(data.correct) : 0);
      }
    } catch { /* Private browsing or malformed data: start with fresh progress. */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed, attempts, correct })); } catch { /* Storage is optional. */ }
  }, [completed, attempts, correct]);

  const active = topics.find((topic) => topic.id === activeTopic) ?? topics[1];
  const quizQuestions = useMemo(() => questions.filter((q) => q.topic === activeTopic || activeTopic === "all"), [activeTopic]);
  const currentQuestion = quizQuestions[questionIndex];

  function startQuiz(topicId: string) {
    setActiveTopic(topicId);
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setView("quiz");
  }

  function chooseAnswer(answer: string) {
    if (checked) return;
    setSelected(answer);
    setChecked(true);
    setAttempts((n) => n + 1);
    if (answer === currentQuestion.answer) {
      setCorrect((n) => n + 1);
      setScore((n) => n + 1);
    }
  }

  function nextQuestion() {
    if (questionIndex + 1 >= quizQuestions.length) {
      setCompleted((old) => old.includes(activeTopic) ? old : [...old, activeTopic]);
      setView("progress");
      return;
    }
    setQuestionIndex((n) => n + 1);
    setSelected(null);
    setChecked(false);
  }

  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-5">
          <button className="brand flex items-center gap-2" onClick={() => setView("home")} aria-label="MathLab etusivu">
            <span className="brand-mark">M</span><span className="wordmark">Math<span>Lab</span></span>
          </button>
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Päävalikko">
            <NavButton active={view === "home"} onClick={() => setView("home")} icon={<Home size={16}/>} label="Etusivu"/>
            <NavButton active={view === "topics" || view === "lesson"} onClick={() => setView("topics")} icon={<BookOpen size={16}/>} label="Opiskele"/>
            <NavButton active={view === "progress"} onClick={() => setView("progress")} icon={<Trophy size={16}/>} label="Edistyminen"/>
          </nav>
          <button className="icon-button sm:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Avaa valikko">{menuOpen ? <X/> : <Menu/>}</button>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm md:flex"><Sparkles size={16} className="text-amber-500"/> Oppiminen alkaa tästä</div>
        </header>
        {menuOpen && <div className="mb-4 flex gap-2 rounded-2xl bg-white p-2 shadow sm:hidden"><NavButton active={view==="home"} onClick={()=>{setView("home");setMenuOpen(false)}} label="Etusivu"/><NavButton active={view==="topics"} onClick={()=>{setView("topics");setMenuOpen(false)}} label="Opiskele"/><NavButton active={view==="progress"} onClick={()=>{setView("progress");setMenuOpen(false)}} label="Edistyminen"/></div>}

        {view === "home" && <HomeView completed={completed} attempts={attempts} accuracy={accuracy} onStart={() => startQuiz("all")} onTopics={() => setView("topics")} onProgress={() => setView("progress")} onLesson={(id) => {setActiveTopic(id);setView("lesson")}}/>}
        {view === "topics" && <TopicsView completed={completed} onLesson={(id)=>{setActiveTopic(id);setView("lesson")}} onQuiz={startQuiz}/>} 
        {view === "lesson" && <LessonView topic={active} onBack={()=>setView("topics")} onQuiz={()=>startQuiz(activeTopic)}/>} 
        {view === "quiz" && currentQuestion && <QuizView question={currentQuestion} index={questionIndex} total={quizQuestions.length} selected={selected} checked={checked} score={score} onAnswer={chooseAnswer} onNext={nextQuestion} onExit={()=>setView("topics")}/>} 
        {view === "progress" && <ProgressView attempts={attempts} correct={correct} accuracy={accuracy} completed={completed} onReset={()=>{setCompleted([]);setAttempts(0);setCorrect(0)}} onTopics={()=>setView("topics")}/>} 
      </div>
    </main>
  );
}

function NavButton({active,onClick,icon,label}:{active:boolean;onClick:()=>void;icon?:ReactNode;label:string}) {
  return <button onClick={onClick} className={`nav-button ${active?"nav-active":""}`}>{icon}{label}</button>;
}

function HomeView({completed,attempts,accuracy,onStart,onTopics,onProgress,onLesson}:{completed:string[];attempts:number;accuracy:number;onStart:()=>void;onTopics:()=>void;onProgress:()=>void;onLesson:(id:string)=>void}) {
  return <>
    <section className="hero panel">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> 8. LUOKAN MATEMATIIKKA</div>
        <h1>Matikka haltuun.<br/><span>Yksi oivallus kerrallaan.</span></h1>
        <p>Harjoittele yhtälöitä ja verrannollisuutta selkeillä esimerkeillä, pienillä tehtävillä ja välittömällä palautteella.</p>
        <div className="hero-actions"><button className="button-primary" onClick={onStart}>Aloita harjoittelu <ArrowRight size={18}/></button><button className="button-secondary" onClick={onTopics}>Selaa aiheita</button></div>
        <div className="hero-meta"><span><CheckCircle2 size={15}/> Oma tahti</span><span><Sparkles size={15}/> Välitön palaute</span><span><Target size={15}/> Edistyminen tallessa</span></div>
      </div>
      <div className="hero-illustration" aria-label="Yhtälön ratkaisemisen kuvitus">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="math-card card-main"><span className="math-label">RATKAISE X</span><strong>2x + 6 = 18</strong><div className="math-divider"/><span className="math-answer">x = 6 <CheckCircle2 size={18}/></span></div>
        <div className="float-note note-one">+ 7</div><div className="float-note note-two">÷ 2</div><div className="float-note note-three">x ?</div>
        <div className="sparkle sparkle-one">✳</div><div className="sparkle sparkle-two">✦</div>
      </div>
    </section>

    <section className="stats-grid" aria-label="Oppimisen yhteenveto">
      <StatCard icon={<Target/>} label="Tehtäviä tehty" value={String(attempts)} tone="blue"/>
      <StatCard icon={<CheckCircle2/>} label="Oikein" value={attempts?accuracy+" %":"–"} tone="green"/>
      <StatCard icon={<Trophy/>} label="Aiheita harjoiteltu" value={String(completed.length)} tone="orange"/>
    </section>

    <section className="section-block">
      <div className="section-heading"><div><span className="section-kicker">OPPIMISPOLKU</span><h2>Mistä aloitetaan?</h2><p>Valitse aihe ja etene omaan tahtiisi.</p></div><button className="text-link" onClick={onTopics}>Kaikki aiheet <ChevronRight size={17}/></button></div>
      <div className="topic-grid">
        {topics.slice(0,4).map((topic,i)=><TopicCard key={topic.id} topic={topic} number={i+1} done={completed.includes(topic.id)} onClick={()=>onLesson(topic.id)}/>)}
      </div>
    </section>
    <section className="bottom-cta"><div className="cta-icon"><Lightbulb/></div><div><h3>Opi ymmärtämään, älä vain muistamaan.</h3><p>Jokaisen vastauksen jälkeen saat selityksen siitä, miksi ratkaisu toimii.</p></div><button className="button-primary" onClick={onStart}>Tee tehtäviä <ArrowRight size={17}/></button></section>
    <footer className="footer">MathLab <span>·</span> Matematiikkaa harjoittelemalla, yksi askel kerrallaan.</footer>
  </>;
}

function TopicsView({completed,onLesson,onQuiz}:{completed:string[];onLesson:(id:string)=>void;onQuiz:(id:string)=>void}) {
  return <section className="page-section"><PageHeading kicker="OPPIMISPOLKU" title="Valitse harjoiteltava aihe" description="Lue ensin lyhyt teoria tai siirry suoraan tehtäviin."/><div className="topic-grid topic-grid-all">{topics.map((topic,i)=><div key={topic.id} className="topic-card-wrap"><TopicCard topic={topic} number={i+1} done={completed.includes(topic.id)} onClick={()=>onLesson(topic.id)}/><button className="topic-quick" onClick={()=>onQuiz(topic.id)}>Aloita tehtävät <ArrowRight size={15}/></button></div>)}</div><button className="back-link" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}><ArrowLeft size={16}/> Takaisin ylös</button></section>;
}

function LessonView({topic,onBack,onQuiz}:{topic:Topic;onBack:()=>void;onQuiz:()=>void}) {
  return <section className="page-section"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> Kaikki aiheet</button><div className="lesson-hero"><span className={`topic-icon large tone-${topic.colour}`}>{topic.icon}</span><div><span className="section-kicker">OPPITUNTI</span><h1>{topic.title}</h1><p>{topic.description}</p></div></div><div className="lesson-panel"><h2>Muista nämä</h2><ol className="lesson-list">{topic.lesson.map((line,i)=><li key={i}><span>{i+1}</span><p>{line}</p></li>)}</ol><div className="example-box"><div className="example-label"><Lightbulb size={16}/> MUISTA</div><p>Yhtälön molemmille puolille tehdään aina sama laskutoimitus, jotta yhtäsuuruus säilyy.</p></div></div><button className="button-primary lesson-start" onClick={onQuiz}>Harjoittele tätä aihetta <ArrowRight size={18}/></button></section>;
}

function QuizView({question,index,total,selected,checked,score,onAnswer,onNext,onExit}:{question:Question;index:number;total:number;selected:string|null;checked:boolean;score:number;onAnswer:(a:string)=>void;onNext:()=>void;onExit:()=>void}) {
  const isCorrect = selected === question.answer;
  return <section className="quiz-shell"><div className="quiz-top"><button className="back-link" onClick={onExit}><ArrowLeft size={16}/> Lopeta harjoitus</button><div className="quiz-score"><Trophy size={17}/> {score} oikein</div></div><div className="quiz-progress"><div style={{width:`${((index+1)/total)*100}%`}}/></div><div className="quiz-meta"><span>TEHTÄVÄ {index+1} / {total}</span><span className={`level level-${question.level.toLowerCase()}`}>{question.level}</span></div><div className="quiz-card"><div className="quiz-icon"><ListChecks size={24}/></div><h1>{question.prompt}</h1><p>Valitse oikea vastaus.</p><div className="answer-list">{question.choices.map((choice,i)=><button key={choice} onClick={()=>onAnswer(choice)} disabled={checked} className={`answer-option ${selected===choice?(isCorrect?"answer-correct":"answer-wrong"):""} ${checked&&choice===question.answer?"answer-reveal":""}`}><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{choice}</span>{checked&&choice===question.answer&&<Check size={19}/>} {checked&&selected===choice&&!isCorrect&&<X size={19}/>}</button>)}</div>{checked&&<div className={`feedback ${isCorrect?"feedback-good":"feedback-bad"}`}><strong>{isCorrect?"Hienosti tehty!":"Ei ihan, kokeillaan oppia tästä."}</strong><p>{question.explanation}</p></div>}<div className="quiz-bottom"><span>{checked?"Vastaus kirjattu":"Valitse yksi vaihtoehto"}</span>{checked&&<button className="button-primary" onClick={onNext}>{index+1===total?"Katso tulokset":"Seuraava tehtävä"} <ArrowRight size={17}/></button>}</div></div></section>;
}

function ProgressView({attempts,correct,accuracy,completed,onReset,onTopics}:{attempts:number;correct:number;accuracy:number;completed:string[];onReset:()=>void;onTopics:()=>void}) {
  return <section className="page-section"><PageHeading kicker="OMA OPPIMINEN" title="Edistymisesi" description="Kaikki harjoittelusi tallentuu tähän selaimeen."/><div className="progress-overview"><div><span>TEHTÄVIÄ</span><strong>{attempts}</strong></div><div><span>OIKEIN</span><strong>{correct}</strong></div><div><span>TARKKUUS</span><strong>{attempts?accuracy+" %":"–"}</strong></div></div><h2 className="progress-title">Aiheiden edistyminen</h2><div className="progress-topics">{topics.map((topic)=>{const done=completed.includes(topic.id);return <div className="progress-topic" key={topic.id}><span className={`topic-icon tone-${topic.colour}`}>{topic.icon}</span><div><strong>{topic.title}</strong><p>{done?"Harjoituskierros tehty":"Ei vielä harjoiteltu"}</p></div><span className={done?"done-tag":"todo-tag"}>{done?"Valmis":"Aloittamatta"}</span></div>})}</div><div className="progress-actions"><button className="button-primary" onClick={onTopics}>Jatka opiskelua <ArrowRight size={17}/></button><button className="button-secondary" onClick={onReset}><RotateCcw size={16}/> Nollaa edistyminen</button></div></section>;
}

function PageHeading({kicker,title,description}:{kicker:string;title:string;description:string}) { return <div className="page-heading"><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>; }
function StatCard({icon,label,value,tone}:{icon:ReactNode;label:string;value:string;tone:string}) { return <div className="stat-card"><span className={`stat-icon tone-${tone}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div>; }
function TopicCard({topic,number,done,onClick}:{topic:Topic;number:number;done:boolean;onClick:()=>void}) { return <button className="topic-card" onClick={onClick}><div className="topic-card-top"><span className={`topic-icon tone-${topic.colour}`}>{topic.icon}</span><span className="topic-number">{String(number).padStart(2,"0")}</span></div><h3>{topic.title}</h3><p>{topic.subtitle}</p><div className="topic-card-bottom"><span>{done?<><CheckCircle2 size={15}/> Harjoiteltu</>: "Tutustu aiheeseen"}</span><ChevronRight size={18}/></div></button>; }
