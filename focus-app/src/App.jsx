import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const starterTasks = [
  { id: 'local-1', title: 'Continue Spring Boot course', meta: 'Learning · 45 min', done: false },
  { id: 'local-2', title: 'Build the next backend feature', meta: 'Project · 60 min', done: false },
  { id: 'local-3', title: 'Gym', meta: 'Personal · 60 min', done: false },
]

function taskFromRow(row) {
  return { ...row, done: row.status === 'done', meta: [row.estimated_minutes ? `${row.estimated_minutes} min` : null, row.is_emergency ? 'Emergency' : null].filter(Boolean).join(' · ') || 'Today' }
}

export default function App() {
  const [tasks, setTasks] = useState(starterTasks)
  const [newTask, setNewTask] = useState('')
  const [focusTask, setFocusTask] = useState(null)
  const [whatNow, setWhatNow] = useState(null)
  const [focusSession, setFocusSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [focusStartedAt, setFocusStartedAt] = useState(null)
  const remaining = useMemo(() => tasks.filter((task) => !task.done).length, [tasks])

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined }
    let mounted = true
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setUser(data.session?.user ?? null); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false) })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!user || !supabase) return undefined
    let cancelled = false
    async function loadToday() {
      setLoading(true); setError('')
      const { data, error: queryError } = await supabase.from('tasks').select('*').eq('status', 'today').order('is_emergency', { ascending: false }).order('scheduled_for', { ascending: true, nullsFirst: true }).order('created_at', { ascending: true })
      if (cancelled) return
      if (queryError) setError(queryError.message); else setTasks((data ?? []).map(taskFromRow))
      setLoading(false)
    }
    loadToday()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!focusStartedAt || !focusTask) return undefined
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) { window.clearInterval(timer); finishFocus('completed'); return 0 }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [focusStartedAt, focusTask])

  async function addTask(event) {
    event.preventDefault(); const title = newTask.trim(); if (!title) return; setError('')
    if (!user || !supabase) { setTasks((current) => [...current, { id: `local-${Date.now()}`, title, meta: 'Added just now', done: false }]); setNewTask(''); return }
    const { data, error: insertError } = await supabase.from('tasks').insert({ user_id: user.id, title, status: 'today' }).select().single()
    if (insertError) { setError(insertError.message); return }
    setTasks((current) => [...current, taskFromRow(data)]); setNewTask('')
  }

  async function toggleTask(task) {
    const nextDone = !task.done; setError('')
    if (!user || !supabase || String(task.id).startsWith('local-')) { setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done: nextDone } : item)); return }
    const updates = nextDone ? { status: 'done', completed_at: new Date().toISOString() } : { status: 'today', completed_at: null }
    const { error: updateError } = await supabase.from('tasks').update(updates).eq('id', task.id)
    if (updateError) { setError(updateError.message); return }
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...updates, done: nextDone } : item))
  }

  async function signIn() {
    if (!supabase) return
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (authError) setError(authError.message)
  }

  async function signOut() { if (!supabase) return; await supabase.auth.signOut(); setTasks(starterTasks) }
  function startFocus(task) { setFocusTask(task); setSecondsLeft(25 * 60); setFocusStartedAt(null); setFocusSession(null) }

  async function beginFocus() {
    setFocusStartedAt(Date.now())
    if (!user || !supabase || String(focusTask.id).startsWith('local-')) return
    const { data, error: insertError } = await supabase.from('focus_sessions').insert({ user_id: user.id, task_id: focusTask.id, started_at: new Date().toISOString(), planned_minutes: 25 }).select().single()
    if (insertError) setError(insertError.message); else setFocusSession(data)
  }

  async function finishFocus(outcome) {
    if (!focusTask) return
    const started = focusStartedAt; setFocusStartedAt(null)
    if (focusSession && supabase) {
      const actualMinutes = started ? Math.max(1, Math.round((Date.now() - started) / 60000)) : 25
      await supabase.from('focus_sessions').update({ ended_at: new Date().toISOString(), actual_minutes: actualMinutes, outcome }).eq('id', focusSession.id)
    }
    const task = focusTask; setFocusSession(null); setFocusTask(null)
    if (outcome === 'completed') await toggleTask(task)
  }

  const timer = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">focus<span>·</span></div>
        <div className="top-actions">
          <span className={`connection ${isSupabaseConfigured ? 'live' : ''}`}>{isSupabaseConfigured ? (user ? `Signed in · ${user.email ?? 'account'}` : 'Supabase ready') : 'Local mode'}</span>
          {isSupabaseConfigured && (user ? <button className="ghost" onClick={signOut}>Sign out</button> : <button className="ghost" onClick={signIn}>Sign in with Google</button>)}
        </div>
      </header>
      <section className="hero"><p className="eyebrow">TODAY</p><h1>What matters today?</h1><p className="subhead">You don’t need to manage everything. Just decide what deserves your attention today.</p></section>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <section className="today-grid">
        <div className="panel commitments">
          <div className="panel-heading"><div><p className="eyebrow">COMMITMENTS</p><h2>{remaining} remaining</h2></div><span className="soft-label">{user ? 'Synced' : 'Local'}</span></div>
          <div className="task-list">
            {loading && <p className="empty-state">Loading your commitments…</p>}
            {!loading && tasks.length === 0 && <p className="empty-state">Nothing committed yet. Add one thing you genuinely want to do today.</p>}
            {!loading && tasks.map((task) => <article className={`task ${task.done ? 'done' : ''}`} key={task.id}><button className="check" onClick={() => toggleTask(task)} aria-label={`Mark ${task.title} ${task.done ? 'open' : 'complete'}`}>{task.done ? '✓' : ''}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.meta}</span></div>{!task.done && <button className="focus-button" onClick={() => startFocus(task)}>Focus</button>}</article>)}
          </div>
          <form className="add-form" onSubmit={addTask}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add something you commit to today…" /><button type="submit">Add</button></form>
        </div>
        <aside className="panel now-panel"><p className="eyebrow">WHAT NOW?</p><h2>Choose your next move.</h2><p>Tell Focus how much time and energy you have. It should give you options, not orders.</p><div className="choice-row"><button onClick={() => setWhatNow('15 min · low energy')}>15m</button><button onClick={() => setWhatNow('30 min · medium energy')}>30m</button><button onClick={() => setWhatNow('60 min · high energy')}>60m</button></div>{whatNow && <div className="suggestion"><span>Suggested context</span><strong>{whatNow}</strong><small>Continue your plan or pick a quick win.</small></div>}</aside>
      </section>
      <section className="principle"><span>Reality wins.</span> Plans can change. Unfinished work is information, not failure.</section>
      {focusTask && <div className="modal-backdrop" onClick={() => !focusStartedAt && setFocusTask(null)}><div className="focus-modal" onClick={(event) => event.stopPropagation()}><p className="eyebrow">FOCUS MODE</p><h2>{focusTask.title}</h2><p>One task. Protected attention. Start whenever you’re ready.</p><div className="timer">{timer}</div><div className="modal-actions">{!focusStartedAt ? <button className="primary" onClick={beginFocus}>Start focus</button> : <button className="primary" onClick={() => finishFocus('partial')}>Finish session</button>}{!focusStartedAt && <button className="ghost" onClick={() => setFocusTask(null)}>Not now</button>}</div></div></div>}
    </main>
  )
}
