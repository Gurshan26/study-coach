import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import BottomNav from './BottomNav.jsx';
import Toasts from '../shared/Toast.jsx';

export default function Layout({ children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1380px] gap-4 p-3 pb-24 md:p-4 md:pb-4">
      <Sidebar />
      <main className="flex-1 space-y-4">
        <TopBar />
        {children}
      </main>
      <BottomNav />
      <Toasts />
    </div>
  );
}
