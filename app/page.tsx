"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Home, Lightbulb, ListChecks, Menu, RotateCcw, Sparkles, Target, Trophy, X } from "lucide-react";
import { SolverView } from "@/components/solver/SolverView";
import { questionsFor, type Question } from "@/content/questions";
import { topics, type Topic } from "@/content/topics";
import { resetProgress, updateProgress, useProgress } from "@/hooks/useProgress";
import { LEVELS, getLevel } from "@/lib/equations";
import { accuracyOf, recordAnswer, recordSolverLevel, recordTopicsCompleted } from "@/lib/progress";

export default function HomePage() {
  const [view, setView] = useState<"home"|"topics"|"lesson"|"quiz"|"progress"|"results"|"solver">("home");
  const [lastRun, setLastRun] = useState<{ score: number; total: number; topicId: string } | null>(null);
  const [activeTopic, setActiveTopic] = useState("one-step");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<string|null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Progress is stored in this browser only; see lib/progress.ts and hooks/useProgress.ts.
  const progress = useProgress();
  const { completed, attempts, correct, solverLevels } = progress;

  const active = topics.find((topic) => topic.id === activeTopic) ?? topics[1];
  const activeLevel = getLevel(activeTopic);
  const quizQuestions = useMemo(() => questionsFor(activeTopic), [activeTopic]);
  const currentQuestion = quizQuestions[questionIndex];

  function startQuiz(topicId: string) {
    setActiveTopic(topicId);
    setQuestionIndex(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setView("quiz");
  }

  function openLesson(topicId: string) {
    setActiveTopic(topicId);
    setView("lesson");
  }

  function openSolver(levelId: string) {
    setActiveTopic(levelId);
    setView("solver");
  }

  // The first solver level the learner has not finished yet, or the topic list when all are done.
  function startLearning() {
    const next = LEVELS.find((level) => !solverLevels.includes(level.id));
    if (next) openSolver(next.id);
    else setView("topics");
  }

  function chooseAnswer(answer: string) {
    if (checked) return;
    const isCorrect = answer === currentQuestion.answer;
    setSelected(answer);
    setChecked(true);
    updateProgress((old) => recordAnswer(old, isCorrect));
    if (isCorrect) setScore((n) => n + 1);
  }

  function nextQuestion() {
    if (questionIndex + 1 >= quizQuestions.length) {
      updateProgress((old) => recordTopicsCompleted(old, quizQuestions.map((item) => item.topic)));
      setLastRun({ score, total: quizQuestions.length, topicId: activeTopic });
      setView("results");
      return;
    }
    setQuestionIndex((n) => n + 1);
    setSelected(null);
    setChecked(false);
  }

  const accuracy = accuracyOf(progress);
  // A topic counts as finished once its practice round or its interactive solver level is done.
  const finished = [...new Set([...completed, ...solverLevels])];

  return (
    <main className="min-h-screen pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-5">
          <button className="brand flex items-center gap-2" onClick={() => setView("home")} aria-label="MathLab home">
            <span className="brand-mark">M</span><span className="wordmark">Math<span>Lab</span></span>
          </button>
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Main navigation">
            <NavButton active={view === "home"} onClick={() => setView("home")} icon={<Home size={16}/>} label="Home"/>
            <NavButton active={view === "topics" || view === "lesson" || view === "solver"} onClick={() => setView("topics")} icon={<BookOpen size={16}/>} label="Learn"/>
            <NavButton active={view === "progress"} onClick={() => setView("progress")} icon={<Trophy size={16}/>} label="Progress"/>
          </nav>
          <button className="icon-button sm:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">{menuOpen ? <X/> : <Menu/>}</button>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm md:flex"><Sparkles size={16} className="text-amber-500"/> Your next learning step</div>
        </header>
        {menuOpen && <div className="mb-4 flex gap-2 rounded-2xl bg-white p-2 shadow sm:hidden"><NavButton active={view==="home"} onClick={()=>{setView("home");setMenuOpen(false)}} label="Home"/><NavButton active={view==="topics"} onClick={()=>{setView("topics");setMenuOpen(false)}} label="Learn"/><NavButton active={view==="progress"} onClick={()=>{setView("progress");setMenuOpen(false)}} label="Progress"/></div>}

        {view === "home" && <HomeView completed={finished} attempts={attempts} accuracy={accuracy} started={solverLevels.length > 0} onStart={startLearning} onPractice={() => startQuiz("all")} onTopics={() => setView("topics")} onLesson={openLesson}/>}
        {view === "topics" && <TopicsView completed={finished} onLesson={openLesson} onQuiz={startQuiz} onSolver={openSolver}/>} 
        {view === "lesson" && <LessonView topic={active} onBack={()=>setView("topics")} onQuiz={()=>startQuiz(activeTopic)} onSolver={activeLevel ? () => openSolver(active.id) : undefined}/>} 
        {view === "solver" && activeLevel && <SolverView key={activeLevel.id} level={activeLevel} topic={active} onComplete={(levelId) => updateProgress((old) => recordSolverLevel(old, levelId))} onExit={() => setView("topics")} onOpenLevel={openSolver} onQuiz={startQuiz}/>}
        {view === "quiz" && currentQuestion && <QuizView question={currentQuestion} index={questionIndex} total={quizQuestions.length} selected={selected} checked={checked} score={score} onAnswer={chooseAnswer} onNext={nextQuestion} onExit={()=>setView("topics")}/>} 
        {view === "results" && lastRun && <ResultsView result={lastRun} onRetry={() => startQuiz(lastRun.topicId)} onTopics={() => setView("topics")} onProgress={() => setView("progress")}/>}
        {view === "progress" && <ProgressView attempts={attempts} correct={correct} accuracy={accuracy} completed={completed} solverLevels={solverLevels} onReset={()=>{resetProgress();setLastRun(null)}} onTopics={()=>setView("topics")}/>} 
      </div>
    </main>
  );
}

function NavButton({active,onClick,icon,label}:{active:boolean;onClick:()=>void;icon?:ReactNode;label:string}) {
  return <button onClick={onClick} className={`nav-button ${active?"nav-active":""}`}>{icon}{label}</button>;
}

function HomeView({completed,attempts,accuracy,started,onStart,onPractice,onTopics,onLesson}:{completed:string[];attempts:number;accuracy:number;started:boolean;onStart:()=>void;onPractice:()=>void;onTopics:()=>void;onLesson:(id:string)=>void}) {
  return <>
    <section className="hero panel">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> GRADE 8 MATHEMATICS</div>
        <h1>Make maths make sense.<br/><span>One discovery at a time.</span></h1>
        <p>Build confidence with equations and proportional relationships through clear examples, short exercises and instant feedback.</p>
        <div className="hero-actions"><button className="button-primary" onClick={onStart}>{started?"Continue learning":"Start learning"} <ArrowRight size={18}/></button><button className="button-secondary" onClick={onTopics}>Explore topics</button></div>
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
    <section className="bottom-cta"><div className="cta-icon"><Lightbulb/></div><div><h3>Learn to understand, not just memorise.</h3><p>Every answer includes an explanation of why the method works.</p></div><button className="button-primary" onClick={onPractice}>Practise now <ArrowRight size={17}/></button></section>
    <footer className="footer">MathLab <span>·</span> Build mathematical confidence, one step at a time.</footer>
  </>;
}

function TopicsView({completed,onLesson,onQuiz,onSolver}:{completed:string[];onLesson:(id:string)=>void;onQuiz:(id:string)=>void;onSolver:(id:string)=>void}) {
  return <section className="page-section"><PageHeading kicker="LEARNING PATH" title="Choose a topic to explore" description="Review the key ideas first or jump straight into practice."/><div className="topic-grid topic-grid-all">{topics.map((topic,i)=><div key={topic.id} className="topic-card-wrap"><TopicCard topic={topic} number={i+1} done={completed.includes(topic.id)} onClick={()=>onLesson(topic.id)}/><div className="topic-quick-row">{getLevel(topic.id)&&<button className="topic-quick" onClick={()=>onSolver(topic.id)}>Solve step by step <ArrowRight size={15}/></button>}<button className="topic-quick" onClick={()=>onQuiz(topic.id)}>{getLevel(topic.id)?"Quiz":"Start practice"} <ArrowRight size={15}/></button></div></div>)}</div><button className="back-link" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}><ArrowLeft size={16}/> Back to top</button></section>;
}

function LessonView({topic,onBack,onQuiz,onSolver}:{topic:Topic;onBack:()=>void;onQuiz:()=>void;onSolver?:()=>void}) {
  return <section className="page-section"><button className="back-link" onClick={onBack}><ArrowLeft size={16}/> All topics</button><div className="lesson-hero"><span className={`topic-icon large tone-${topic.colour}`}>{topic.icon}</span><div><span className="section-kicker">QUICK LESSON</span><h1>{topic.title}</h1><p>{topic.description}</p></div></div><div className="lesson-panel"><h2>Key ideas</h2><ol className="lesson-list">{topic.lesson.map((line,i)=><li key={i}><span>{i+1}</span><p>{line}</p></li>)}</ol><div className="example-box"><div className="example-label"><Lightbulb size={16}/> REMEMBER</div><p>Always perform the same operation on both sides of an equation to preserve equality.</p></div></div><div className="lesson-actions">{onSolver&&<button className="button-primary lesson-start" onClick={onSolver}>Solve step by step <ArrowRight size={18}/></button>}<button className={onSolver?"button-secondary lesson-start":"button-primary lesson-start"} onClick={onQuiz}>{onSolver?"Take the quiz":"Practise this topic"} <ArrowRight size={18}/></button></div></section>;
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

function ProgressView({attempts,correct,accuracy,completed,solverLevels,onReset,onTopics}:{attempts:number;correct:number;accuracy:number;completed:string[];solverLevels:string[];onReset:()=>void;onTopics:()=>void}) {
  return <section className="page-section"><PageHeading kicker="YOUR LEARNING" title="Your progress" description="Your progress is saved in this browser on this device."/><div className="progress-overview"><div><span>QUESTIONS</span><strong>{attempts}</strong></div><div><span>CORRECT</span><strong>{correct}</strong></div><div><span>ACCURACY</span><strong>{attempts?accuracy+" %":"–"}</strong></div></div><h2 className="progress-title">Topic progress</h2><div className="progress-topics">{topics.map((topic)=>{const practised=completed.includes(topic.id);const solved=solverLevels.includes(topic.id);const done=practised||solved;const status=practised&&solved?"Step-by-step solver and quiz completed":solved?"Step-by-step solver completed":practised?"Practice round completed":"Not practised yet";return <div className="progress-topic" key={topic.id}><span className={`topic-icon tone-${topic.colour}`}>{topic.icon}</span><div><strong>{topic.title}</strong><p>{status}</p></div><span className={done?"done-tag":"todo-tag"}>{done?"Completed":"Not started"}</span></div>})}</div><div className="progress-actions"><button className="button-primary" onClick={onTopics}>Continue learning <ArrowRight size={17}/></button><button className="button-secondary" onClick={onReset}><RotateCcw size={16}/> Reset progress</button></div></section>;
}

function PageHeading({kicker,title,description}:{kicker:string;title:string;description:string}) { return <div className="page-heading"><span className="section-kicker">{kicker}</span><h1>{title}</h1><p>{description}</p></div>; }
function StatCard({icon,label,value,tone}:{icon:ReactNode;label:string;value:string;tone:string}) { return <div className="stat-card"><span className={`stat-icon tone-${tone}`}>{icon}</span><div><strong>{value}</strong><span>{label}</span></div></div>; }
function TopicCard({topic,number,done,onClick}:{topic:Topic;number:number;done:boolean;onClick:()=>void}) { return <button className="topic-card" onClick={onClick}><div className="topic-card-top"><span className={`topic-icon tone-${topic.colour}`}>{topic.icon}</span><span className="topic-number">{String(number).padStart(2,"0")}</span></div><h3>{topic.title}</h3><p>{topic.subtitle}</p><div className="topic-card-bottom"><span>{done?<><CheckCircle2 size={15}/> Practised</>: "Explore topic"}</span><ChevronRight size={18}/></div></button>; }
