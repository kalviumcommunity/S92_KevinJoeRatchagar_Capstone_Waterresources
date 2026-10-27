import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || ''

const emptyForm = { name: '', type: 'Reservoir', location: '', condition: '', description: '' }

function App() {
  const [resources, setResources] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [suggestionError, setSuggestionError] = useState('')
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionSource, setSuggestionSource] = useState('')

  useEffect(() => {
    let active = true
    const fetchResources = async () => {
      try {
        const response = await fetch(`${API_URL}/api/water-resources`)
        if (!response.ok) throw new Error('Unable to load water resources.')
        if (active) setResources(await response.json())
      } catch (requestError) {
        if (active) setError(`${requestError.message} Make sure the API and MongoDB are running.`)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchResources()
    return () => { active = false }
  }, [])

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const handleSuggestDescription = async () => {
    if (!form.name.trim() || !form.type.trim() || !form.location.trim()) {
      setSuggestionError('Enter a resource name, type, and location before requesting a suggestion.')
      return
    }

    setSuggestionLoading(true)
    setSuggestionError('')
    setSuggestionSource('')

    try {
      const response = await fetch(`${API_URL}/api/ai/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to suggest a description.')
      setForm((currentForm) => ({ ...currentForm, description: result.description }))
      setSuggestionSource(result.source)
    } catch (requestError) {
      setSuggestionError(requestError.message || 'Unable to reach the description service.')
    } finally {
      setSuggestionLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/api/water-resources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to save resource.')
      setResources((currentResources) => [data, ...currentResources])
      setForm(emptyForm)
      setSuggestionSource('')
      setMessage('Water resource saved successfully.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/water-resources/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Unable to delete resource.')
      setResources((currentResources) => currentResources.filter((resource) => resource._id !== id))
      setMessage('Water resource deleted.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header"><a className="brand" href="#top">AquaLedger</a><nav aria-label="Primary navigation"><a href="#resources">Resources</a><a href="#add-resource">Add resource</a></nav></header>
      <main id="top">
        <section className="intro"><p className="eyebrow">S92 water resources registry</p><h1>Know what water you have.</h1><p className="intro-copy">A shared register for tracking reservoirs, wells, and other water sources with reliable API-backed records.</p><div className="status-pill" aria-live="polite"><span className={`status-dot ${error ? 'offline' : ''}`} />{error ? 'API needs attention' : 'API connected'}</div></section>
        <section className="workspace" id="resources"><div className="section-heading"><div><p className="eyebrow">Live records</p><h2>Water resources</h2></div><span className="record-count">{resources.length} records</span></div>
          {message && <p className="feedback success" role="status">{message}</p>}{error && <p className="feedback error" role="alert">{error}</p>}
          {loading ? <p className="empty-state">Loading records...</p> : resources.length === 0 ? <p className="empty-state">No water resources yet. Add the first one below.</p> : <div className="resource-list">{resources.map((resource) => <article className="resource-row" key={resource._id}><div><p className="resource-type">{resource.type}</p><h3>{resource.name}</h3><p>{resource.location}</p>{resource.condition && <p>Current condition: {resource.condition}</p>}{resource.description && <p className="description">{resource.description}</p>}</div><button className="delete-button" type="button" onClick={() => handleDelete(resource._id)} aria-label={`Delete ${resource.name}`}>Delete</button></article>)}</div>}
        </section>
        <section className="add-section" id="add-resource"><div className="section-heading"><div><p className="eyebrow">Database write</p><h2>Add a resource</h2></div></div><form onSubmit={handleSubmit}><div className="form-grid"><label>Resource name<input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Kaveri Reservoir" required /></label><label>Type<select name="type" value={form.type} onChange={handleChange}><option>Reservoir</option><option>Well</option><option>Lake</option><option>Rainwater tank</option><option>Canal</option></select></label><label>Location<input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Tiruchirappalli" required /></label><label>Current condition<input name="condition" value={form.condition} onChange={handleChange} placeholder="e.g. Water level is moderate" maxLength="500" /></label><label className="wide-field">Description<textarea name="description" value={form.description} onChange={handleChange} placeholder="Add a short note or generate a suggestion to edit" rows="3" maxLength="2000" /><span className="suggestion-controls"><button className="suggestion-button" type="button" onClick={handleSuggestDescription} disabled={suggestionLoading}>{suggestionLoading ? 'Generating...' : 'Suggest description'}</button>{suggestionSource && <span className="suggestion-note">{suggestionSource === 'llm' ? 'Generated by the configured LLM; review and edit before saving.' : 'Local fallback suggestion; no LLM API key is configured.'}</span>}</span>{suggestionError && <span className="suggestion-error" role="alert">{suggestionError}</span>}</label></div><button className="submit-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save resource'}</button></form></section>
      </main>
      <footer>Water resources, recorded clearly.</footer>
    </div>
  )
}

export default App