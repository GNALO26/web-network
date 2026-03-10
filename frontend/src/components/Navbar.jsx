import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/">Accueil</Link>
      <Link to="/profile">Profil</Link>
      <span>Bienvenue, {user.name}</span>
      <button onClick={logout}>Déconnexion</button>
    </nav>
  );
};

export default Navbar;