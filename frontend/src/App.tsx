import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Transactions } from './pages/Transactions';
import { Prediction } from './pages/Prediction';
import { getDashboardData } from './api/dashboardApi';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Periodically check API connection status
  useEffect(() => {
    const checkApi = async () => {
      try {
        await getDashboardData();
        setApiOnline(true);
      } catch (err) {
        console.error('API connection check failed:', err);
        setApiOnline(false);
      }
    };

    // Initial check
    checkApi();

    // Check every 30 seconds
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuToggle = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleMenuClose = () => {
    setSidebarOpen(false);
  };

  const handleApiStatusChange = (status: boolean) => {
    setApiOnline(status);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-200">
        {/* Navigation Sidebar */}
        <Sidebar 
          apiOnline={apiOnline} 
          isOpen={sidebarOpen} 
          onClose={handleMenuClose} 
        />

        {/* Main Content Layout */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    onApiStatusChange={handleApiStatusChange} 
                    onMenuToggle={handleMenuToggle} 
                  />
                } 
              />
              <Route 
                path="/customers" 
                element={<Customers onMenuToggle={handleMenuToggle} />} 
              />
              <Route 
                path="/customer/:customerId" 
                element={<CustomerDetails onMenuToggle={handleMenuToggle} />} 
              />
              <Route 
                path="/transactions" 
                element={<Transactions onMenuToggle={handleMenuToggle} />} 
              />
              <Route 
                path="/prediction" 
                element={<Prediction onMenuToggle={handleMenuToggle} />} 
              />
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
