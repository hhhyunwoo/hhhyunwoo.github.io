---
title: About
layout: about
icon: fas fa-info-circle
order: 5
---

<style>
/* Modern About Page Styles */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.about-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  line-height: 1.6;
  color: #2d3748;
}

.hero-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 20px;
  padding: 3rem 2rem;
  margin-bottom: 3rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(59, 130, 246, 0.03), rgba(16, 185, 129, 0.03));
  border-radius: 20px;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.profile-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 1.5rem;
  border: 4px solid #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.name {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1a202c;
}

.tagline {
  font-size: 1.2rem;
  color: #64748b;
  margin-bottom: 2rem;
  font-weight: 400;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 50px;
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.contact-link:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  color: #2d3748;
}

.contact-item {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.contact-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 50px;
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.contact-link::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background-image: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23a0a0a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>');
  background-size: 16px 16px;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.contact-link:hover::after {
  opacity: 1;
}

.contact-link:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  color: #2d3748;
  padding-right: 2.5rem;
}

.copy-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #059669;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.copy-toast.show {
  opacity: 1;
  transform: translateX(0);
}

.section-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.25rem;
  color: #3b82f6;
}

.about-text {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #4a5568;
  margin-bottom: 1.5rem;
}

.experience-item {
  padding: 1.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.experience-item:last-child {
  border-bottom: none;
}

.company-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.job-title {
  font-size: 1rem;
  font-weight: 500;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.job-period {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current-badge {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
}

.job-description {
  color: #4a5568;
  line-height: 1.6;
}

.job-description ul {
  margin: 0;
  padding-left: 1.5rem;
}

.job-description li {
  margin-bottom: 0.5rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.skill-category {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.skill-category h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 1rem;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-tag {
  background: #ffffff;
  color: #4a5568;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #e2e8f0;
}

.education-item {
  padding: 1rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.education-item:last-child {
  border-bottom: none;
}

.school-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.degree-info {
  color: #4a5568;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.education-period {
  color: #64748b;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .about-container {
    padding: 1rem 0.5rem;
  }
  
  .hero-section {
    padding: 2rem 1rem;
  }
  
  .name {
    font-size: 2rem;
  }
  
  .tagline {
    font-size: 1rem;
  }
  
  .contact-links {
    flex-direction: column;
    align-items: center;
  }
  
  .contact-link {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
  
  .section-card {
    padding: 1.5rem;
  }
  
  .skills-grid {
    grid-template-columns: 1fr;
  }
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-card {
  animation: fadeInUp 0.6s ease-out;
}
</style>

<script>
function copyToClipboard(text, event) {
  // Check if this is the email button
  const isEmailButton = event.target.closest('.contact-email');
  
  if (isEmailButton) {
    // For email button, prevent default and copy only
    event.preventDefault();
    
    // Use modern clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showCopyToast();
      }).catch(() => {
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
  } else {
    // For other buttons, copy to clipboard and then navigate
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showCopyToast();
      }).catch(() => {
        fallbackCopyToClipboard(text);
      });
    } else {
      fallbackCopyToClipboard(text);
    }
    
    // Don't prevent default for non-email buttons - let them navigate
    // The link will open in new tab due to target="_blank"
  }
}

function fallbackCopyToClipboard(text) {
  // Fallback for older browsers
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showCopyToast();
}

function showCopyToast() {
  // Create toast if it doesn't exist
  let toast = document.querySelector('.copy-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = 'Copied to clipboard!';
    document.body.appendChild(toast);
  }
  
  // Show toast
  toast.classList.add('show');
  
  // Hide toast after 2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}
</script>

<div class="about-container">
  <!-- Hero Section -->
  <div class="hero-section">
    <div class="hero-content">
      <img src="https://user-images.githubusercontent.com/37402136/143150326-e30ee110-7924-4350-928d-bfdade556128.jpeg" alt="Hans H. Kim" class="profile-image">
      <h1 class="name">Hans H. Kim</h1>
      <p class="tagline">Machine Learning Engineer • Keep Blitz and Be Simple</p>
      <div class="contact-links">
        <div class="contact-item">
          <a href="#" class="contact-link contact-email" onclick="copyToClipboard('hyunwoo.h.kim@gmail.com', event)">
            <i class="fas fa-envelope"></i>
            Email
          </a>
        </div>
        <div class="contact-item">
          <a href="https://github.com/hhhyunwoo" class="contact-link" target="_blank" onclick="copyToClipboard('https://github.com/hhhyunwoo', event)">
            <i class="fab fa-github"></i>
            GitHub
          </a>
        </div>
        <div class="contact-item">
          <a href="https://www.linkedin.com/in/hyunwoo-hans-kim/" class="contact-link" target="_blank" onclick="copyToClipboard('https://www.linkedin.com/in/hyunwoo-hans-kim/', event)">
            <i class="fab fa-linkedin"></i>
            LinkedIn
          </a>
        </div>
        <div class="contact-item">
          <a href="https://bit.ly/3DOJRqp" class="contact-link" target="_blank" onclick="copyToClipboard('https://bit.ly/3DOJRqp', event)">
            <i class="fas fa-file-alt"></i>
            Portfolio
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- About Me Section -->
  <div class="section-card">
    <h2 class="section-title">
      <i class="fas fa-user section-icon"></i>
      About Me
    </h2>
    <p class="about-text">
      I'm a software engineer who is curious about every new things. My motto is "Keep Blitz and Be Simple" - I always try to be simple and efficient in my approach to problem-solving.
    </p>
    <p class="about-text">
      I specialize in <strong>MLOps platform development</strong>, <strong>DevOps engineering</strong>, and <strong>cloud-native technologies</strong>. With extensive experience in operating large-scale systems, I've successfully managed over 2000 GPUs and built robust, scalable infrastructure solutions.
    </p>
  </div>

  <!-- Experience Section -->
  <div class="section-card">
    <h2 class="section-title">
      <i class="fas fa-briefcase section-icon"></i>
      Experience
    </h2>
    
    <div class="experience-item">
      <h3 class="company-name">Toss Bank</h3>
      <div class="job-title">Machine Learning Engineer</div>
      <div class="job-period">
        <span>Oct 2023 - Present</span>
        <span class="current-badge">Current</span>
      </div>
      <div class="job-description">
        <ul>
          <li>Built Machine Learning Platform contributing to flexible model development and deployment</li>
          <li>Pioneered high-performance Online Feature Store Platform using ScyllaDB, achieving performance improvements in write throughput and read latency</li>
          <li>Engineered large-scale Airflow batch systems managing 2K+ workflows across 7+ clusters with 99.9% uptime</li>
          <li>Developed Python-based Credit Strategy System reducing deployment time by 50%</li>
          <li>Built caching system using MongoDB, reducing errors by 60% in credit scoring system</li>
          <li>Migrated data ingestion pipeline processing 9M+ daily records from Elasticsearch to MongoDB</li>
        </ul>
      </div>
    </div>

    <div class="experience-item">
      <h3 class="company-name">Kakao Enterprise</h3>
      <div class="job-title">Software Engineer, Machine Learning Platform</div>
      <div class="job-period">Mar 2022 - Aug 2023</div>
      <div class="job-description">
        <ul>
          <li>Developed and maintained large-scale MLOps platform managing over 2,000 GPUs across 20+ Kubernetes clusters</li>
          <li>Built MSA components including backend API Server, CLI, SDK, and inference infrastructure</li>
          <li>Managed Jupyter Notebook functionality integrating JupyterHub and Enterprise Gateway</li>
          <li>Led GPU migration projects with 99.9% system uptime during facility relocations</li>
          <li>Implemented Model Artifact resource functionality with CRUD APIs and versioning</li>
          <li>Established unified API server error code policy across multiple backend teams</li>
        </ul>
      </div>
    </div>

    <div class="experience-item">
      <h3 class="company-name">Kakao Enterprise</h3>
      <div class="job-title">Software System Engineer, AI Lab</div>
      <div class="job-period">Jul 2020 - Feb 2022</div>
      <div class="job-description">
        <ul>
          <li>Built infrastructure and tools supporting voice-related research for 100+ AI researchers</li>
          <li>Designed Voice Transcription Tool with React and Django enabling processing of 3K+ voice data daily</li>
          <li>Operated voice data log management system handling 3M+ daily logs from 100K+ users</li>
          <li>Built Kakao i Cloud STT service enabling 20+ custom user language models on Kubernetes</li>
          <li>Developed real-time STT demo services with WebSocket streaming and file upload support</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Skills Section -->
  <div class="section-card">
    <h2 class="section-title">
      <i class="fas fa-code section-icon"></i>
      Skills & Technologies
    </h2>
    <div class="skills-grid">
      <div class="skill-category">
        <h4>Programming Languages</h4>
        <div class="skill-tags">
          <span class="skill-tag">Python</span>
          <span class="skill-tag">Golang</span>
          <span class="skill-tag">JavaScript</span>
          <span class="skill-tag">Kotlin</span>
          <span class="skill-tag">Shell</span>
        </div>
      </div>
      <div class="skill-category">
        <h4>Cloud Native & DevOps</h4>
        <div class="skill-tags">
          <span class="skill-tag">Kubernetes</span>
          <span class="skill-tag">Docker</span>
          <span class="skill-tag">ArgoCD</span>
          <span class="skill-tag">Helm</span>
          <span class="skill-tag">Istio</span>
          <span class="skill-tag">Terraform</span>
          <span class="skill-tag">CI/CD</span>
        </div>
      </div>
      <div class="skill-category">
        <h4>Databases & Storage</h4>
        <div class="skill-tags">
          <span class="skill-tag">ScyllaDB</span>
          <span class="skill-tag">Cassandra</span>
          <span class="skill-tag">MongoDB</span>
          <span class="skill-tag">MySQL</span>
        </div>
      </div>
      <div class="skill-category">
        <h4>Machine Learning & Data</h4>
        <div class="skill-tags">
          <span class="skill-tag">MLOps</span>
          <span class="skill-tag">MLflow</span>
          <span class="skill-tag">Airflow</span>
          <span class="skill-tag">GPU Computing</span>
        </div>
      </div>
      <div class="skill-category">
        <h4>Frameworks & Tools</h4>
        <div class="skill-tags">
          <span class="skill-tag">React</span>
          <span class="skill-tag">Spring</span>
          <span class="skill-tag">AWS</span>
          <span class="skill-tag">Linux</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Education Section -->
  <div class="section-card">
    <h2 class="section-title">
      <i class="fas fa-graduation-cap section-icon"></i>
      Education
    </h2>
    
    <div class="education-item">
      <h3 class="school-name">Kyungpook National University</h3>
      <div class="degree-info">Bachelor of Computer Science • GPA: 4.10/4.50</div>
      <div class="education-period">2015 - 2021</div>
    </div>

    <div class="education-item">
      <h3 class="school-name">Darmstadt University of Applied Sciences, Germany</h3>
      <div class="degree-info">International Studies Program</div>
      <div class="education-period">Spring 2020</div>
    </div>
  </div>
</div>