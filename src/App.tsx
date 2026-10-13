import { HashRouter, Route, Routes } from 'react-router-dom';
import ClassForm from './pages/ClassForm';
import Editor from './pages/Editor';
import Home from './pages/Home';
import Library from './pages/Library';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<ClassForm />} />
        <Route path="/class/:id" element={<Editor />} />
        <Route path="/class/:id/settings" element={<ClassForm />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/library" element={<Library />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
