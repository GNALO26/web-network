import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import api from "../services/api";
import InvitationNotifications from "./InvitationNotifications";
import Notifications from "./Notifications";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 1) {
      try {
        const { data } = await api.get("/users");
        const filtered = data.filter((u) =>
          u.name.toLowerCase().includes(value.toLowerCase()),
        );
        setUsers(filtered);
        setShowResults(true);
      } catch (error) {
        console.error(error);
      }
    } else {
      setShowResults(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">Accueil</Link>
        <Link to="/explore">Explorer</Link>
        <Link to="/conversations">Messages</Link>
        <Link to="/profile">Mon profil</Link>
      </div>
      <div className="navbar-search">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={handleSearch}
        />
        {showResults && (
          <div className="search-results">
            {users.length ? (
              users.map((u) => (
                <Link
                  key={u._id}
                  to={`/profile/${u._id}`}
                  onClick={() => setShowResults(false)}
                >
                  <img src={u.avatar || "/default-avatar.png"} alt={u.name} />
                  {u.name}
                </Link>
              ))
            ) : (
              <div>Aucun résultat</div>
            )}
          </div>
        )}
      </div>
      <div className="navbar-right">
        <InvitationNotifications />
        <div className="navbar-right">
          <Notifications />
          <span>Bienvenue, {user?.name}</span>
          <button onClick={logout}>Déconnexion</button>
        </div>
        <span>{user?.name}</span>
        <button onClick={logout}>Déconnexion</button>
      </div>
    </nav>
  );
};

export default Navbar;
