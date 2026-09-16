import { useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const starterTasks = [
  { id: 1, title: 'Continue Spring Boot course', meta: 'Learning · 45 min', done: false },
  { id: 2, title: 'Build the next backend feature', meta: 'Project · 60 min', done: false },
  { id: 3, title: 'Gym', meta: 'Personal · 60 min', done: false },
]

export default function App() {
  const [tasks, setTasks] = useState(starterTasks)
  const [newTask, setNewTask] = useState('')
  const [focusTask, setFocusTask] = useState(null)
  const [session, setSession] = useState(null)

  const remaining = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])

  function addTask(event) {
    event.preventDefault()
    const title = newTask.trim()
    if (!title) return
    setTasks((current) => [...current, { id: Date.now(), title, meta: 'Added just now', done: false }])
    setNewTask('')
  }

  function toggleTask(id) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))
  }

  async function signIn() {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">focus<span>·</span></div>
        <div className="top-actions">
          <span className={`connection ${isSupabaseConfigured ? 'live' : ''}`}>
            {isSupabaseConfigured ? 'Supabase ready' : 'Local mode'}
          </span>
          {isSupabaseConfigured && <button className="ghost" onClick={signIn}>Sign in</button>}
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">TODAY</p>
        <h1>What matters today?</h1>
        <p className="subhead">You don’t need to manage everything. Just decide what deserves your attention today.</p>
      </section>

      <section className="today-grid">
        <div className="panel commitments">
          <div className="panel-heading">
            <div><p className="eyebrow">COMMITMENTS</p><h2>{remaining} remaining</h2></div>
            <span className="soft-label">Your choice</span>
          </div>

          <div className="task-list">
            {tasks.map((task) => (
              <article className={`task ${task.done ? 'done' : ''}`} key={task.id}>
                <button className="check" onClick={() => toggleTask(task.id)} aria-label={`Mark ${task.title} ${task.done ? 'open' : 'complete'}`}>
                  {task.done ? '✓' : ''}
                </button>
                <div className="task-copy">
                  <strong>{task.title}</strong>
                  <span>{task.meta}</span>
                </div>
                {!task.done && <button className="focus-button" onClick={() => setFocusTask(task)}>Focus</button>}
              </article>
            ))}
          </div>

          <form className="add-form" onSubmit={addTask}>
            <input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add something you commit to today…" />
            <button type="submit">Add</button>
          </form>
        </div>

        <aside className="panel now-panel">
          <p className="eyebrow">WHAT NOW?</p>
          <h2>Choose your next move.</h2>
          <p>Tell Focus how much time and energy you have. It should give you options, not orders.</p>
          <div className="choice-row"><button onClick={() => setSession('15 min · low energy')}>15m</button><button onClick={() => setSession('30 min · medium energy')}>30m</button><button onClick={() => setSession('60 min · high energy')}>60m</button></div>
          {session && <div className="suggestion"><span>Suggested context</span><strong>{session}</strong><small>Continue your plan or pick a quick win.</small></div>}
        </aside>
      </section>

      <section className="principle"><span>Reality wins.</span> Plans can change. Unfinished work is information, not failure.</section>

      {focusTask && (
        <div className="modal-backdrop" onClick={() => setFocusTask(null)}>
          <div className="focus-modal" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">FOCUS MODE</p>
            <h2>{focusTask.title}</h2>
            <p>One task. Protected attention. Start whenever you’re ready.</p>
            <div className="timer">25:00</div>
            <div className="modal-actions"><button className="primary" onClick={() => setFocusTask(null)}>Start focus</button><button className="ghost" onClick={() => setFocusTask(null)}>Not now</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
