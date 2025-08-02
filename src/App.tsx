import { Routes, Route } from 'react-router-dom';
import { ApplicationProvider } from '@/store/ApplicationStore';
import Layout from '@/components/Layout/Layout';
import HomePage from '@/pages/HomePage';
import AnalysisPage from '@/pages/AnalysisPage';
import HistoryPage from '@/pages/HistoryPage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
    <ApplicationProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </ApplicationProvider>
  );
}

export default App;
