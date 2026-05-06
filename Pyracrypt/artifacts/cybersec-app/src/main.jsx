import './react-compat.js'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Router, Route, Switch } from 'wouter'

import AdminConsole from './AdminConsole.jsx'
import App from './App.jsx'
import ProductPage from './pages/ProductPage.jsx'
import MethodPage from './pages/MethodPage.jsx'
import CapabilitiesPage from './pages/CapabilitiesPage.jsx'
import IntelligencePage from './pages/IntelligencePage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LockPage from './pages/LockPage.jsx'
import GrowthLaunchpad from './pages/GrowthLaunchpad.jsx'
import PricingPage from './pages/PricingPage.jsx'
import { IntroScreen } from './components/IntroScreen.jsx'
import './index.css'

function Root() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <AdminConsole />
  }
  const skipIntro = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('skip')
  const [entered, setEntered] = useState(skipIntro)

  return (
    <Router>
      {!entered && <IntroScreen onEnter={() => setEntered(true)} />}
      <Switch>
        <Route path="/"              component={App} />
        <Route path="/product"       component={ProductPage} />
        <Route path="/method"        component={MethodPage} />
        <Route path="/capabilities"  component={CapabilitiesPage} />
        <Route path="/intelligence"  component={IntelligencePage} />
        <Route path="/contact"       component={ContactPage} />
        <Route path="/dashboard"     component={DashboardPage} />
        <Route path="/lock"          component={LockPage} />
        <Route path="/growth"        component={GrowthLaunchpad} />
        <Route path="/pricing"       component={PricingPage} />
        <Route>
          <div style={{ padding: '120px 80px', textAlign: 'center', fontSize: 14, color: '#606870' }}>
            Page not found — <a href="/" style={{ color: '#6D91B3' }}>go home</a>
          </div>
        </Route>
      </Switch>
    </Router>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
