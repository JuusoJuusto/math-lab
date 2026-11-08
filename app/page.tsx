"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Home, Lightbulb, ListChecks, Menu, RotateCcw, Sparkles, Target, Trophy, X } from "lucide-react";

type Question = {
  id: string;
  topic: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
};

type Topic = { id: string; title: string; subtitle: string; colour: string; icon: string; description: string; lesson: string[] };

const topics: Topic[] = [
  { id: "basics", title: "Understanding equations", subtitle: "What does equality mean?", colour: "blue", icon: "⚖️", description: "Learn what an equation is and how to find an unknown value.", lesson: ["An equation says that its left-hand side and right-hand side have the same value.", "A letter such as x represents an unknown number.", "An equation stays balanced when you perform the same operation on both sides.", "The goal is to isolate x on one side of the equation."] },
  { id: "simple", title: "One-step and two-step equations", subtitle: "Solve for x, one step at a time", colour: "green", icon: "🔎", description: "Practice addition, subtraction, multiplication and division in equations.", lesson: ["Undo addition by subtracting the same value from both sides.", "If x is multiplied by a number, divide both sides by that number.", "Check your solution by substituting it into the original equation."] },
  { id: "both", title: "Variables on both sides", subtitle: "Collect the variable terms", colour: "orange", icon: "↔️", description: "Move variable terms to one side and constants to the other.", lesson: ["Choose the side on which you want to keep x.", "Subtract the variable term from both sides to collect the x terms.", "Combine like terms, then solve the simpler equation."] },
  { id: "brackets", title: "Equations with brackets", subtitle: "Expand brackets correctly", colour: "purple", icon: "( )", description: "Practice the distributive property and expanding brackets.", lesson: ["Multiply every term inside the brackets by the factor outside.", "For example, 3(x + 2) = 3x + 6.", "Then solve the resulting equation as usual."] },
  { id: "proportion", title: "Proportional relationships", subtitle: "How quantities change together", colour: "pink", icon: "📈", description: "Explore direct and inverse proportion.", lesson: ["In direct proportion, two quantities change by the same factor.", "In inverse proportion, increasing one quantity decreases the other in a corresponding way.", "In direct proportion, the ratio y/x stays constant."] },
  { id: "word", title: "Word problems", subtitle: "Turn a situation into an equation", colour: "teal", icon: "💬", description: "Build and solve equations from everyday situations.", lesson: ["Read the problem and decide what the unknown x represents.", "Use the information in the problem to write an equation.", "Solve the equation and answer the question in a complete sentence.", "Check that your answer makes sense in the given situation."] }
];

const questions: Question[] = [
  { id:"q1", topic:"simple", level:"Beginner", prompt:"Solve the equation:  x + 7 = 15", choices:["x = 8","x = 22","x = 7","x = 9"], answer:"x = 8", explanation:"Subtract 7 from both sides: x = 15 − 7 = 8." },
  { id:"q2", topic:"simple", level:"Beginner", prompt:"Solve the equation:  4x = 28", choices:["x = 24","x = 7","x = 32","x = 6"], answer:"x = 7", explanation:"Divide both sides by 4: x = 28 / 4 = 7." },
  { id:"q3", topic:"simple", level:"Beginner", prompt:"Solve the equation:  x − 9 = 4", choices:["x = −5","x = 13","x = 36","x = 5"], answer:"x = 13", explanation:"Add 9 to both sides: x = 4 + 9 = 13." },
  { id:"q4", topic:"both", level:"Intermediate", prompt:"Solve the equation:  5x + 2 = 3x + 12", choices:["x = 5","x = 7","x = 10","x = 2"], answer:"x = 5", explanation:"Subtract 3x and 2: 2x = 10. Divide by 2: x = 5." },
  { id:"q5", topic:"both", level:"Intermediate", prompt:"Solve the equation:  7x − 4 = 4x + 11", choices:["x = 3","x = 5","x = 7","x = 15"], answer:"x = 5", explanation:"Subtract 4x and add 4: 3x = 15, so x = 5." },
  { id:"q6", topic:"brackets", level:"Intermediate", prompt:"Solve the equation:  2(x + 3) = 18", choices:["x = 6","x = 9","x = 12","x = 3"], answer:"x = 6", explanation:"Expand the brackets: 2x + 6 = 18. Subtract 6, then divide by 2: x = 6." },
  { id:"q7", topic:"brackets", level:"Advanced", prompt:"Solve the equation:  3(x − 2) = 2x + 5", choices:["x = 9","x = 11","x = 7","x = 1"], answer:"x = 11", explanation:"Expand the brackets: 3x − 6 = 2x + 5. Subtract 2x and add 6: x = 11." },
  { id:"q8", topic:"proportion", level:"Beginner", prompt:"2 kg of apples cost €6. How much do 5 kg cost at the same price per kilogram?", choices:["10 €","12 €","15 €","18 €"], answer:"15 €", explanation:"One kilogram costs €6 / 2 = €3. Five kilograms cost 5 × €3 = €15." },
  { id:"q9", topic:"proportion", level:"Intermediate", prompt:"On a map, 1 cm represents 4 km. What distance does 3.5 cm represent?", choices:["7 km","12 km","14 km","16 km"], answer:"14 km", explanation:"Distance is directly proportional to map length: 3.5 × 4 km = 14 km." },
  { id:"q10", topic:"word", level:"Intermediate", prompt:"Three identical pens cost €6 in total. What is the price of one pen?", choices:["1 €","2 €","3 €","6 €"], answer:"2 €", explanation:"Let x be the price of one pen: 3x = 6. Divide by three to get x = €2." },
  { id:"q11", topic:"basics", level:"Beginner", prompt:"Which of the following is an equation?", choices:["3x + 2","3x + 2 = 11","x > 4","2 + 5"], answer:"3x + 2 = 11", explanation:"An equation has an equals sign and two expressions with the same value." },
  { id:"q12", topic:"proportion", level:"Advanced", prompt:"Four workers complete a job in 12 hours. How long would eight workers take at the same rate?", choices:["3 hours","6 hours","12 hours","24 hours"], answer:"6 hours", explanation:"The number of workers and the time are inversely proportional. Doubling the workforce halves the time: 12 / 2 = 6 hours." }
];

const STORAGE_KEY = "mathlab:progress:v1";

export default function HomePage() {
  const [view, setView] = useState<"home"|"topics"|"lesson"|"quiz"|"progress"|"results">("home");
  const [lastRun, setLastRun] = useState<{ score: number; total: number; topicId: string } | null>(null);
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
      setCompleted((old) => [...new Set([...old, ...quizQuestions.map((item) => item.topic)])]);
      setLastRun({ score, total: quizQuestions.length, topicId: activeTopic });
      setView("results");
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
          <button className="brand flex items-center gap-2" onClick={() => setView("home")} aria-label="MathLab home">
            <span className="brand-mark">M</span><span className="wordmark">Math<span>Lab</span></span>
          </button>
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Main navigation">
            <NavButton active={view === "home"} onClick={() => setView("home")} icon={<Home size={16}/>} label="Home"/>
            <NavButton active={view === "topics" || view === "lesson"} onClick={() => setView("topics")} icon={<BookOpen size={16}/>} label="Learn"/>
            <NavButton active={view === "progress"} onClick={() => setView("progress")} icon={<Trophy size={16}/>} label="Progress"/>
          </nav>
          <button className="icon-button sm:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">{menuOpen ? <X/> : <Menu/>}</button>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm md:flex"><Sparkles size={16} className="text-amber-500"/> Your next learning step</div>
        </header>
        {menuOpen && <div className="mb-4 flex gap-2 rounded-2xl bg-white p-2 shadow sm:hidden"><NavButton active={view==="home"} onClick={()=>{setView("home");setMenuOpen(false)}} label="Home"/><NavButton active={view==="topics"} onClick={()=>{setView("topics");setMenuOpen(false)}} label="Learn"/><NavButton active={view==="progress"} onClick={()=>{setView("progress");setMenuOpen(false)}} label="Progress"/></div>}

        {view === "home" && <HomeView completed={completed} attempts={attempts} accuracy={accuracy} onStart={() => startQuiz("all")} onTopics={() => setView("topics")} onProgress={() => setView("progress")} onLesson={(id) => {setActiveTopic(id);setView("lesson")}}/>}
        {view === "topics" && <TopicsView completed={completed} onLesson={(id)=>{setActiveTopic(id);setView("lesson")}} onQuiz={startQuiz}/>} 
        {view === "lesson" && <LessonView topic={active} onBack={()=>setView("topics")} onQuiz={()=>startQuiz(activeTopic)}/>} 
        {view === "quiz" && currentQuestion && <QuizView question={currentQuestion} index={questionIndex} total={quizQuestions.length} selected={selected} checked={checked} score={score} onAnswer={chooseAnswer} onNext={nextQuestion} onExit={()=>setView("topics")}/>} 
        {view === "results" && lastRun && <ResultsView result={lastRun} onRetry={() => startQuiz(lastRun.topicId)} onTopics={() => setView("topics")} onProgress={() => setView("progress")}/>}
        {view === "progress" && <ProgressView attempts={attempts} correct={correct} accuracy={accuracy} completed={completed} onReset={()=>{setCompleted([]);setAttempts(0);setCorrect(0);setLastRun(null)}} onTopics={()=>setView("topics")}/>} 
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
        <div className="eyebrow"><span className="eyebrow-dot"/> GRADE 8 MATHEMATICS</div>
        <h1>Make maths make sense.<br/><span>One discovery at a time.</span></h1>
        <p>Build confidence with equations and proportional relationships through clear examples, short exercises and instant feedback.</p>
        <div className="hero-actions"><button className="button-primary" onClick={onStart}>Start learning <ArrowRight size={18}/></button><button className="button-secondary" onClick={onTopics}>Explore topics</button></div>
        <div className="hero-meta"><span><CheckCircle2 size={15}/> Learn at your own pace</span><span><Sparkles size={15}/> Instant feedback</span><span><Target size={15}/> Progress saved</span></div>
      </div>
      <div className="hero-illustration" aria-label="Equation-solving illustration">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="math-card card-main"><span className="math-label">SOLVE FOR X</span><strong>2x + 6 = 18</strong><div className="math-divider"/><span className="math-answer">x = 6 <CheckCircle2 size={18}/></span></div>
        <div className="float-note note-one">+ 7</div><div className="float-note note-two">÷ 2</div><div className="float-note note-three">x ?</div>
        <div className="sparkle sparkle-one">✳</div><div className="sparkle sparkle-two">✦</div>
      </div>
    </section>

    <section className="stats-grid" aria-label="Learning overview">
      <StatCard icon={<Target/>} label="Questions answered" value={String(attempts)} tone="blue"/>
      <StatCard icon={<CheckCircle2/>} label="Accuracy" value={attempts?accuracy+" %":"–"} tone="green"/>
      <StatCard icon={<Trophy/>} label="Topics completed" value={String(completed.length)} tone="orange"/>
    </section>

    <section className="section-block">
      <div className="section-heading"><div><span className="section-kicker">LEARNING PATH</span><h2>Where should we start?</h2><p>Choose a topic and learn at your own pace.</p></div><button className="text-link" onClick={onTopics}>All topics <ChevronRight size={17}/></button></div>
      <div className="topic-grid">
        {topics.slice(0,4).map((topic,i)=><TopicCard key={topic.id} topic={topic} number={i+1} done={completed.includes(topic.id)} onClick={()=>onLesson(topic.id)}/>)}
      </div>
    </section>
    <section className="bottom-cta"><div className="cta-icon"><Lightbulb/></div><div><h3>Learn to understand, not just memorise.</h3><p>Every answer includes an explanation of why the method works.</p></div><button className="button-primary" onClick={onStart}>Practise now <ArrowRight size={17}/></button></section>
    <footer className="footer">MathLab <span>·</span> Build mathematical confidence, one step at a time.</footer>
  </>;
}

function TopicsView({completed,onLesson,onQuiz}:{completed:string[];onLesson:(id:string)=>void;onQuiz:(id:string)=>void}) {
  return <section className="page-section"><PageHeading kicker="LEARNING PATH" title="Choose a topic to explore" description="Review the key ideas first or jump straight into practice."/><div className="topic-grid topic-grid-all">{topics.map((topic,i)=><div key={topic.id} className="topic-card-wrap"><TopicCard topic={topic} number={i+1} done={completed.includes(topic.id)} onClick={()=>onLesson(topic.id)}/><button className="topic-quick" onClick={()=>onQuiz(topic.id)}>Start practice <ArrowRight size={15}/></button></div>)}</div><button className="back-link" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}><ArrowLeft size={16}/> Back to top</button></section>;
}

function LessonView({topic,onBack,onQuiz}:{topic:Topic;onBack:()=>void;onQuiz:()=>void}) {
  return <section className="page-section"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> All topics</button><div className="lesson-hero"><span className={`topic-icon large tone-${topic.colour}`}>{topic.icon}</span><div><span className="section-kicker">QUICK LESSON</span><h1>{topic.title}</h1><p>{topic.description}</p></div></div><div className="lesson-panel"><h2>Key ideas</h2><ol className="lesson-list">{topic.lesson.map((line,i)=><li key={i}><span>{i+1}</span><p>{line}</p></li>)}</ol><div className="example-box"><div className="example-label"><Lightbulb size={16}/> REMEMBER</div><p>Always perform the same operation on both sides of an equation to preserve equality.</p></div></div><button className="button-primary lesson-start" onClick={onQuiz}>Practise this topic <ArrowRight size={18}/></button></section>;
}

function QuizView({question,index,total,selected,checked,score,onAnswer,onNext,onExit}:{question:Question;index:number;total:number;selected:string|null;checked:boolean;score:number;onAnswer:(a:string)=>void;onNext:()=>void;onExit:()=>void}) {
  const isCorrect = selected === question.answer;
  return <section className="quiz-shell"><div className="quiz-top"><button className="back-link" onClick={onExit}><ArrowLeft size={16}/> Exit practice</button><div className="quiz-score"><Trophy size={17}/> {score} correct</div></div><div className="quiz-progress"><div style={{width:`${((index+1)/total)*100}%`}}/></div><div className="quiz-meta"><span>QUESTION {index+1} / {total}</span><span className={`level level-${question.level.toLowerCase()}`}>{question.level}</span></div><div className="quiz-card"><div className="quiz-icon"><ListChecks size={24}/></div><h1>{question.prompt}</h1><p>Choose the correct answer.</p><div className="answer-list">{question.choices.map((choice,i)=><button key={choice} onClick={()=>onAnswer(choice)} disabled={checked} className={`answer-option ${selected===choice?(isCorrect?"answer-correct":"answer-wrong"):""} ${checked&&choice===question.answer?"answer-reveal":""}`}><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{choice}</span>{checked&&choice===question.answer&&<Check size={19}/>} {checked&&selected===choice&&!isCorrect&&<X size={19}/>}</button>)}</div>{checked&&<div className={`feedback ${isCorrect?"feedback-good":"feedback-bad"}`}><strong>{isCorrect?"Great work!":"Not quite. Let's learn from this."}</strong><p>{question.explanation}</p></div>}<div className="quiz-bottom"><span>{checked?"Answer submitted":"Choose an answer"}</span>{checked&&<button className="button-primary" onClick={onNext}>{index+1===total?"View results":"Next question"} <ArrowRight size={17}/></button>}</div></div></section>;
}

function ResultsView({result,onRetry,onTopics,onProgress}:{result:{score:number;total:number;topicId:string};onRetry:()=>void;onTopics:()=>void;onProgress:()=>void}) {
  const percentage = result.total ? Math.round((result.score / result.total) * 100) : 0;
  const title = percentage === 100 ? "Perfect round!" : percentage >= 70 ? "Nice progress!" : "Keep building your skills!";
  return <section className="page-section"><div className="results-card"><div className="results-medal"><Trophy size={34}/></div><span className="section-kicker">PRACTICE COMPLETE</span><h1>{title}</h1><p>You answered {result.score} out of {result.total} questions correctly.</p><div className="results-score">{percentage}<span>%</span></div><div className="results-bar"><span style={{width: percentage + "%"}}/></div><div className="results-actions"><button className="button-primary" onClick={onRetry}>Try again <RotateCcw size={16}/></button><button className="button-secondary" onClick={onTopics}>Explore topics</button><button className="text-link" onClick={onProgress}>View all progress <ArrowRight size={16}/></button></div></div></section>;
}

function ProgressView({attempts,correct,accuracy,completed,onReset,onTopics}:{attempts:number;correct:number;accuracy:number;completed:string[];onReset:()=>void;onTopics:()=>void}) {
  return <section className="page-section"><PageHeading kicker="YOUR LEARNING" title="Your progress" description="Your progress is saved in this browser on this device."/><div className="progress-overview"><div><span>QUESTIONS</span><strong>{attempts}</strong></div><div><span>CORRECT</span><strong>{correct}</strong></div><div><span>ACCURACY</span><strong>{attempts?accuracy+" %":"–"}</strong></div></div><h2 className="progress-title">Topic progress</h2><div className="progress-topics">{topics.map((topic)=>{const done=completed.includes(topic.id);return <div className="progress-topic" key={topic.id}><span className={`topic-icon tone-${topic.colour}`}>{topic.icon}</span><div><strong>{topic.title}</strong><p>{done?"Practice round completed":"Not practised yet"}</p></div><span className={done?"done-tag":"todo-tag"}>{done?"Completed":"Not started"}</span></div>})}</div><div className="progress-actions"><button className="button-primary" onClick={onTopics}>Continue learning <ArrowRight size={17}/></button><button className="button-secondary" onClick={onReset}><RotateCcw size={16}/> Reset progress</button></div></section>;
}

function PageHeading({kicker,title,description}:{kicker:string;title:string;description:string}) { return <div className="page-heading"><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>; }
function StatCard({icon,label,value,tone}:{icon:ReactNode;label:string;value:string;tone:string}) { return <div className="stat-card"><span className={`stat-icon tone-${tone}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div>; }
function TopicCard({topic,number,done,onClick}:{topic:Topic;number:number;done:boolean;onClick:()=>void}) { return <button className="topic-card" onClick={onClick}><div className="topic-card-top"><span className={`topic-icon tone-${topic.colour}`}>{topic.icon}</span><span className="topic-number">{String(number).padStart(2,"0")}</span></div><h3>{topic.title}</h3><p>{topic.subtitle}</p><div className="topic-card-bottom"><span>{done?<><CheckCircle2 size={15}/> Practised</>: "Explore topic"}</span><ChevronRight size={18}/></div></button>; }
