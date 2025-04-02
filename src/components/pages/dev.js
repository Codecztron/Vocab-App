import React from "react";

function DeveloperInfo() {
  return (
    <div className="dev-info-tab card-style">
      <h2 className="dev-title">Developer Info</h2>
      <p className="dev-intro">
        Aplikasi ini dikembangkan oleh Andri, dengan tujuan melatih vocab dengan
        metode quiz. Hubungi developer jika ada pertanyaan! Semoga bermanfaat.
      </p>
      <div className="dev-contact-grid">
        <div className="dev-contact-item">
          <strong className="dev-contact-label">Instagram:</strong>
          <a
            href="https://www.instagram.com/andrksuma/"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-contact-link instagram-link"
          >
            @andrksuma
          </a>
        </div>
        <div className="dev-contact-item">
          <strong className="dev-contact-label">Email:</strong>
          <a
            href="mailto:andribussi76@gmail.com"
            className="dev-contact-link email-link"
          >
            andribussi76@gmail.com
          </a>
        </div>
      </div>
      <div className="dev-support-section">
        <h3>Dukung Developer</h3>
        <p>
          Jika Anda merasa aplikasi ini bermanfaat sangat amat diperbolehkan
          kok. Semoga rejeki lancar yaa!
        </p>
        <a
          href="https://saweria.co/Codecztron"
          target="_blank"
          rel="noopener noreferrer"
          className="dev-support-button primary-button"
        >
          Donasi☕
        </a>
      </div>
    </div>
  );
}

export default DeveloperInfo;
