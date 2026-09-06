export type IconName = "home" | "income" | "expense" | "more" | "arrow" | "lock" | "wallet" | "close";
const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
  income: <><path d="M12 4v16m-6-6 6 6 6-6M5 4h14" /></>,
  expense: <><path d="M12 20V4m-6 6 6-6 6 6M5 20h14" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 8h18m0 5h-6v4h6" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
};
export function Icon({ name }: { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
