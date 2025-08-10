import React, { useState } from 'react';
import { authService } from '../auth/authService';
import './Dashboard.css';
import { useTranslation } from 'react-i18next';
import { getPricingData } from '../pricingData';

// Mock components for different views
const PropertiesView = () => (
  <div>
    <div className="properties-header">
      <div>
        <h1>Properties</h1>
        <p>Organize and view your virtual staging for real estate properties.</p>
      </div>
      <button className="btn btn-primary">+ Add Property</button>
    </div>
    <div className="no-properties-view">
      <div className="plus-icon">+</div>
      <h2>No properties yet</h2>
      <p>Get started by adding your first property and uploading room photos to transform.</p>
      <button className="btn btn-primary">+ Add Property</button>
    </div>
  </div>
);

const BillingView = () => {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState('annual');
  const pricingData = getPricingData(t);
  const [activeTab, setActiveTab] = useState('overview');

  const renderBillingContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="no-properties-view">
            <h2>No Active Subscription</h2>
            <p>Subscribe to a plan to get monthly credits and access to all features.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('plans')}>View Plans</button>
          </div>
        );
      case 'plans':
        return (
          <div>
            <div className="billing-toggle">
              <button
                className={billingCycle === 'monthly' ? 'active' : ''}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('monthly')}
              </button>
              <button
                className={billingCycle === 'annual' ? 'active' : ''}
                onClick={() => setBillingCycle('annual')}
              >
                {t('annual')} <span className="discount-badge">{t('discount')}</span>
              </button>
            </div>
            <div className="pricing-grid">
              {pricingData[billingCycle].map((plan, index) => (
                <div key={index} className={`pricing-card ${plan.isFeatured ? 'featured' : ''}`}>
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">
                    {plan.price} <span className="plan-period">{plan.period}</span>
                  </div>
                  <div className="plan-photos">{plan.photos}</div>
                  <ul className="plan-features">
                    {plan.features.map((feature, i) => (
                      <li key={i}>
                        <span className="tick-icon">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="cta-button">{plan.buttonText}</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'payment-history':
        return (
            <div className="no-properties-view">
                <h2>Payment History</h2>
                <p>View and download your past invoices.</p>
                <div>No payment history found.</div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h1>Billing & Subscription</h1>
      <p>Manage your subscription, payment methods, and billing history.</p>
      <div className="tabs">
        <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''}>Overview</button>
        <button onClick={() => setActiveTab('plans')} className={activeTab === 'plans' ? 'active' : ''}>Plans</button>
        <button onClick={() => setActiveTab('payment-history')} className={activeTab === 'payment-history' ? 'active' : ''}>Payment History</button>
      </div>
      <div className="tab-content">
        {renderBillingContent()}
      </div>
    </div>
  );
};

const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const renderSettingsContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-settings">
            <h3>Profile Information</h3>
            <p>Update your profile information and how others see you on the platform.</p>
            <div className="profile-form">
              <div className="avatar-section">
                <div className="avatar-preview">Д</div>
                <button className="btn">Upload Avatar</button>
                <p>Or enter picture URL</p>
                <input type="text" placeholder="https://example.com/avatar.jpg" />
              </div>
              <div className="form-fields">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" defaultValue="Денис Гаврилюк" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" defaultValue="unitradecargo@gmail.com" readOnly />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input type="text" placeholder="Enter your company name" />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input type="text" placeholder="https://example.com" />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea placeholder="Tell us about yourself"></textarea>
                </div>
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        );
      case 'account':
        return (
            <div className="account-settings">
                <h3>Password & Security</h3>
                <p>Manage your password and security settings. Your account is secured by Auth0.</p>
                <div className="password-section">
                    <p>Password changes are handled securely through Auth0. You’ll receive an email with instructions to reset your password.</p>
                    <div>
                        <p><strong>Current Email</strong></p>
                        <p>unitradecargo@gmail.com</p>
                    </div>
                    <button className="btn">Reset Password</button>
                </div>
            </div>
        );
      case 'notifications':
        return <div>Notification Settings</div>;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      <p>Manage your account settings and preferences.</p>
      <div className="tabs">
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>Profile</button>
        <button onClick={() => setActiveTab('account')} className={activeTab === 'account' ? 'active' : ''}>Account</button>
        <button onClick={() => setActiveTab('notifications')} className={activeTab === 'notifications' ? 'active' : ''}>Notifications</button>
      </div>
      <div className="tab-content">
        {renderSettingsContent()}
      </div>
    </div>
  );
};

// Mock icons
const HomeIcon = () => <span>🏠</span>;
const BillingIcon = () => <span>💳</span>;
const SettingsIcon = () => <span>⚙️</span>;
const CartIcon = () => <span>🛒</span>;
const BellIcon = () => <span>🔔</span>;

const Dashboard = ({ credits, deductCredit }) => {
  const [activeView, setActiveView] = useState('properties');
  const user = authService.getCurrentUser();

  if (!user) {
    return <div>Loading user data...</div>;
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'A';

  const renderView = () => {
    switch (activeView) {
      case 'properties':
        return <PropertiesView />;
      case 'billing':
        return <BillingView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <PropertiesView />;
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">PropStyle.ai</div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeView === 'properties' ? 'active' : ''}>
              <button onClick={() => setActiveView('properties')}><HomeIcon /> Properties</button>
            </li>
            <li className={activeView === 'billing' ? 'active' : ''}>
              <button onClick={() => setActiveView('billing')}><BillingIcon /> Billing</button>
            </li>
            <li className={activeView === 'settings' ? 'active' : ''}>
              <button onClick={() => setActiveView('settings')}><SettingsIcon /> Settings</button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            {/* Can be empty or have breadcrumbs */}
          </div>
          <div className="header-right">
            <span className="credits">{credits} Credits</span>
            <button className="icon-btn"><CartIcon /></button>
            <button className="icon-btn"><BellIcon /></button>
            <div className="user-avatar">{userInitial}</div>
            <button onClick={() => authService.signOut()} className="signout-btn-header">
                Sign Out
            </button>
          </div>
        </header>
        <section className="content-body">
          {renderView()}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;