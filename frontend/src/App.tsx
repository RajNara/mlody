import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState<string>('loading...')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then((data) => setHealth(JSON.stringify(data)))
      .catch((err) => setHealth(`error: ${err}`))
  }, [])

  return (
    <div>
      <h1>MLody</h1>
      <p>Backend status: {health}</p>
    </div>
  )
}

export default App