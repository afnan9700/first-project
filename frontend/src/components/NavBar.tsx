import { Link } from "react-router-dom";  // for navigation links
import { useAuth } from "../contexts/AuthContext";  // to access authentication state
import type { NavItem } from "../types";  // import NavItem type

// type for props passed to NavBar component
interface NavBarProps {
  items: NavItem[]; // array of navigation items
}

export function NavBar({ items }: NavBarProps) {
  const { user } = useAuth();   // get user state from AuthContext

  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <ul style={{ display: "flex", gap: "1rem", listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) => { // iterate over nav items passed as props
          const isLoggedIn = Boolean(user);
          const label = isLoggedIn && item.authLabel ? item.authLabel : item.label;
          const href = isLoggedIn && item.authHref ? item.authHref : item.href;

          if (!label || !href) return null; // skip if label or href is missing
          return (
            <li key={item.id}>
              <Link to={href}>{label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
