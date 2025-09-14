import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Action from './pages/Action';
import ActionArticle from './pages/ActionArticle';
import Resources from './pages/Resources';
import AddResource from './pages/AddResource';
import ResourceDetail from './pages/ResourceDetail';
import About from './pages/About';
import Layout from './components/Layout';
import Map from './components/Map';
import IncidentInfo from './pages/IncidentInfo';
import './App.css';
import { IncidentProvider } from './context/IncidentContext';
import StartupPage from './pages/StartupPage';
import StoryArchive from './pages/StoryArchive';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  return (
    <IncidentProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<StartupPage supabase={supabase} />} />
            <Route path="/map" element={<Map supabase={supabase} />} />
            <Route path="/incident" element={<IncidentInfo supabase={supabase} />} />
            <Route path="/archive" element={<StoryArchive supabase={supabase} />} />
            <Route path="/action" element={<Action />} />
            <Route path="/action/:id" element={<ActionArticle />} />
            <Route path="/resources" element={<Resources supabase={supabase} />} />
            <Route path="/resources/add" element={<AddResource supabase={supabase} />} />
            <Route path="/resource-detail" element={<ResourceDetail supabase={supabase} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
      </Router>
    </IncidentProvider>
  );
}

export default App;
