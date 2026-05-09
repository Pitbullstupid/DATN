import Navbar from './components/Navbar.jsx'
import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage.jsx'
function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className='max-w-screen mx-auto'>
        <Routes>
          <Route path="/" element={<Homepage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
