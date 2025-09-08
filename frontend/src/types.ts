// type for navigation items used in NavBar component
export type NavItem = {
  id: string;   // id to identify each nav item
  label?: string;    // label to display
  href?: string;  // link to navigate to
  authLabel?: string;   // optional label if user is authenticated
  authHref?: string;    // optional link if user is authenticated
};

// type for post metadata
export interface PostMeta {
  _id: string;
  title: string;
  voteCount: number;
  createdAt: string;
  author: string;     // user _id
  authorName: string;
  board: string;      // board _id
  boardName: string;
  commentCount: number;
}