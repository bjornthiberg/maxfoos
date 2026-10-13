import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Home as HomeIcon, Settings } from "lucide-react";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <header className="hall-header">
          <nav aria-label="Huvudmeny">
            <ul className="hall-nav">
              <li>
                <NavLink to="/" end>
                  <HomeIcon size={16} />
                  Hem
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin">
                  <Settings size={16} />
                  Admin
                </NavLink>
              </li>
            </ul>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>MaxFoos Manager</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
