import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Failed to connect to Adonis'))
  }, [])

  return (
    <div>
      <h1>Vite + Adonis Test</h1>
      <p>{message}</p>
    </div>
  )
}

export default App


