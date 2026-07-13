import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img
          className="navbar-brand-icon"
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="navbar-brand-copy">
          <span className="navbar-brand-main">Criptas</span>
          <span className="navbar-brand-subtitle">
            Parroquia de Nuestra Señora de Lourdes
          </span>
        </div>
      </div>

      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          Inicio
        </NavLink>

        <NavLink
          to="/crypts"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          Criptas
        </NavLink>

        <NavLink
          to="/clients"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          Titulares
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
