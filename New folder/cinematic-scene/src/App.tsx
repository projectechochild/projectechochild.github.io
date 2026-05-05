import { useState, useEffect } from 'react'
import Scene from './components/Scene'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-text">Loading cinematic experience...</div>
      </div>
    )
  }

  return (
    <div className="canvas-container">
      <Scene />
    </div>
  )
}

export default App
