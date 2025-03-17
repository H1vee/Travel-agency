import React from 'react';
import './Footer.scss';
import { Logo } from '../../../../components/Logo/Logo';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-logo">
            <Logo />
            <span className="footer-brand">OpenWorld</span>
          </div>
          <div className="footer-copyright">© {currentYear} OpenWorld, Inc. All rights reserved.</div>
        </div>
        
        <div className="footer-right">
          <div className="footer-links">
            <div className="footer-links-group">
              <h4 className="footer-links-title">Company</h4>
              <a href="/AboutUs" className="footer-link">About</a>
              <a href="/careers" className="footer-link">Careers</a>
              <a href="/partners" className="footer-link">Partners</a>
            </div>
            
            <div className="footer-links-group">
              <h4 className="footer-links-title">Legal</h4>
              <a href="/terms" className="footer-link">Terms</a>
              <a href="/privacy" className="footer-link">Privacy</a>
              <a href="/security" className="footer-link">Security</a>
            </div>
            
            <div className="footer-links-group">
              <h4 className="footer-links-title">Resources</h4>
              <a href="/status" className="footer-link">Status</a>
              <a href="/docs" className="footer-link">Docs</a>
              <a href="/contact" className="footer-link">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};