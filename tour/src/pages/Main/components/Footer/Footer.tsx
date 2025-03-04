import React from 'react';
import './Footer.scss';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        
        <div className="footer-logo">
          <img src="/path-to-your-logo.png" alt="Company Logo" />
        </div>

        
        <div className="footer-links">
          <a href="#!" className="footer-link">Terms</a>
          <a href="#!" className="footer-link">Privacy</a>
          <a href="#!" className="footer-link">Security</a>
          <a href="#!" className="footer-link">Status</a>
          <a href="#!" className="footer-link">Docs</a>
          <a href="#!" className="footer-link">Contact</a>
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          © 2025 OpenWorld, Inc.
        </div>
      </div>
    </footer>
  );
};
