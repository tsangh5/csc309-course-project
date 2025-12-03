import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

export default App;
