import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
