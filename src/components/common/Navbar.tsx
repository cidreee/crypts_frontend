import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>Criptas Templo</span>
      </div>

      <div className="navbar-links">
        <NavLink
          to="/clients"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          Clientes
        </NavLink>

        <NavLink
          to="/crypts"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          Criptas
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;