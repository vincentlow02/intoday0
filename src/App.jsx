import usePlatform from './hooks/usePlatform';
import DesktopApp from './pages/DesktopApp';
import InstallPrompt from './components/InstallPrompt';

function App() {
  usePlatform();

  return (
    <>
      <InstallPrompt />
      <DesktopApp />
    </>
  );
}

export default App;
