import Navbar from "./components/Navbar.jsx";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage.jsx";
import TutorDashboard from "./pages/TutorDashboard.jsx";
import TutorProfileEdit from "./pages/TutorProfileEdit.jsx";
import TutorListPage from "./pages/TutorListPage.jsx";
import TutorDetailPage from "./pages/TutorDetailPage.jsx";
import TutorBookingsPage from "./pages/TutorBookingsPage.jsx";
import StudentBookingsPage from "./pages/StudentBookingsPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

import CourseListPage from "./pages/CourseListPage.jsx";
import CourseDetailPage from "./pages/CourseDetailPage.jsx";
import ProfileStudent from "./pages/ProfileStudent.jsx";
import StudentEditProfilePage from "./pages/StudentEditProfilePage.jsx";
import PaymentSuccessPage from "./components/PaymentSuccessPage.jsx";
import PaymentCancelPage from "./components/PaymentCancelPage.jsx";
import TutorWalletPage from "./components/TutorWalletPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
function App() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-base-100">
      {!location.pathname.startsWith("/admin") && <Navbar />}
      <main className="max-w-screen mx-auto">
        <Toaster
          position="top-center"
          toastOptions={{ style: { fontSize: "13px" } }}
          z-index={9999}
        />

        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/profile/edit" element={<TutorProfileEdit />} />
          <Route path="/tutors" element={<TutorListPage />} />
          <Route path="/tutors/:id" element={<TutorDetailPage />} />
          <Route
            path="/tutor/bookings"
            element={
              user?.role === "TUTOR" ? (
                <TutorBookingsPage />
              ) : (
                <StudentBookingsPage />
              )
            }
          />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          {user?.role === "STUDENT" && (
            <>
              <Route path="/profile" element={<ProfileStudent />} />
            </>
          )}
          <Route
            path="/student/profile/edit"
            element={<StudentEditProfilePage />}
          />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          <Route path="/tutor/wallet" element={<TutorWalletPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
