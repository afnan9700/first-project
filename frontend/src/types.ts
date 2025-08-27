// type for navigation items used in NavBar component
export type NavItem = {
  id: string;   // id to identify each nav item
  label?: string;    // label to display
  href?: string;  // link to navigate to
  authLabel?: string;   // optional label if user is authenticated
  authHref?: string;    // optional link if user is authenticated
};