import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const sayHello = () => {
    alert("You're gay 🥴")
  }

  return (
    <div className="app">
      <h1>Du hittade hit! ❤️</h1>
      <p>Under konstruktion 🚧</p>
      <button onClick={sayHello}>Klicka på mig</button>
    </div>
  )
}

export default App

