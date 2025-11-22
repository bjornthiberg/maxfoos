import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Home as HomeIcon, Settings } from "lucide-react";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              MaxFoos Manager
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link
                  to="/"
                  className="nav-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <HomeIcon size={16} />
                  Hem
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/admin"
                  className="nav-link"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Settings size={16} />
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </nav>

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
