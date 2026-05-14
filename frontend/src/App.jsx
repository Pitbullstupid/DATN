import Navbar from './components/Navbar.jsx'
import { Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage.jsx'
import TutorDashboard from './pages/TutorDashboard.jsx'
import TutorProfileEdit from './pages/TutorProfileEdit.jsx'
function App() {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className='max-w-screen mx-auto'>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/tutor/dashboard"     element={<TutorDashboard />} />
          <Route path="/tutor/profile/edit" element={<TutorProfileEdit />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
