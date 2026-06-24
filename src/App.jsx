import React from 'react';
import DesktopApp from './pages/DesktopApp';
import InstallPrompt from './components/InstallPrompt';
import CollectionSharedView from './components/CollectionSharedView';

function App() {
  const [showShared, setShowShared] = React.useState(window.location.hash === '#shared');

  React.useEffect(() => {
    const handleHash = () => setShowShared(window.location.hash === '#shared');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (showShared) {
    return <CollectionSharedView />;
  }

  return (
    <>
      <InstallPrompt />
      <DesktopApp />
    </>
  );
}
export default App;
