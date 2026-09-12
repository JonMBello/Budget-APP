export type IconName =
  | "home"
  | "income"
  | "expense"
  | "more"
  | "arrow"
  | "lock"
  | "wallet"
  | "close"
  | "check"
  | "undo"
  | "edit"
  | "trash";
const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
  income: <><path d="M12 4v16m-6-6 6 6 6-6M5 4h14" /></>,
  expense: <><path d="M12 20V4m-6 6 6-6 6 6M5 20h14" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 8h18m0 5h-6v4h6" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 5 5L20 7" />,
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  trash: <><path d="M4 7h16" /><path d="M10 7V4h4v3" /><path d="m6 7 1 13h10l1-13" /><path d="M10 11v6m4-6v6" /></>,
};
export function Icon({ name }: { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
