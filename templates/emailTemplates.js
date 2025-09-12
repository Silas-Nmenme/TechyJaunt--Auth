const emailTemplates = {
  // Welcome & Email Verification Template
  welcomeTemplate: (name, emailToken, baseUrl = 'https://silascarrentals.netlify.app') => {
    return {
      subject: 'Welcome to Our Car Rental Service - Please Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Silas Car Rentals</title>
            <!-- Bootstrap CSS CDN -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <!-- Animate.css CDN for animations -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
            <!-- AOS (Animate On Scroll) CDN for scroll animations -->
            <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
            <!-- Font Awesome for icons -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                body {
                    font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 40px 20px;
                    color: #333;
                    min-height: 100vh;
                }
                .email-wrapper {
                    max-width: 680px;
                    margin: auto;
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    transform: scale(0.95);
                    transition: transform 0.5s ease;
                }
                .email-wrapper:hover {
                    transform: scale(1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2b70fa;
                    margin: 0;
                    font-size: 32px;
                    font-weight: bold;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header p {
                    color: #666;
                    font-size: 18px;
                    margin-top: 10px;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section h2 {
                    color: #2b70fa;
                    font-size: 24px;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 5px;
                    position: relative;
                }
                .section h2::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 50px;
                    height: 2px;
                    background: linear-gradient(90deg, #2b70fa, #764ba2);
                }
                .token-box {
                    background: linear-gradient(135deg, #f1f6ff 0%, #e0f2fe 100%);
                    border-left: 6px solid #2b70fa;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    color: #2b70fa;
                }
                .button {
                    display: inline-block;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 15px 35px;
                    text-decoration: none;
                    border-radius: 25px;
                    margin: 20px 0;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: transform 0.3s ease;
                }
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                }
                .features-list {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .features-list ul {
                    list-style: none;
                    padding: 0;
                }
                .features-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .features-list li:last-child {
                    border-bottom: none;
                }
                .features-list li i {
                    color: #28a745;
                    margin-right: 10px;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 0.95em;
                    color: #777;
                    border-top: 2px solid #eee;
                    padding-top: 20px;
                }
                .animate-fade-in {
                    animation: fadeIn 1s ease-in;
                }
                .animate-slide-up {
                    animation: slideInUp 0.8s ease-out;
                }
                .animate-bounce-in {
                    animation: bounceIn 1s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper animate__animated animate__fadeInUp">
                <div class="header animate__animated animate__bounceIn" data-aos="zoom-in">
                    <h1><i class="fas fa-car"></i> Welcome to Silas Car Rentals!</h1>
                    <p>Your journey starts here</p>
                </div>

                <div class="section animate__animated animate__fadeInLeft" data-aos="fade-up" data-aos-delay="200">
                    <h2><i class="fas fa-user-check"></i> Hello ${name}!</h2>
                    <p>Thank you for signing up with Silas Car Rentals. We're thrilled to have you join our community of satisfied customers!</p>
                    <p><strong>To complete your registration and unlock full access, please verify your email address:</strong></p>
                </div>

                <div class="section animate__animated animate__fadeInRight" data-aos="fade-up" data-aos-delay="400">
                    <div class="token-box animate__animated animate__pulse" data-aos="flip-up" data-aos-delay="500">
                        <i class="fas fa-key"></i> <strong>Verification Token:</strong><br>
                        <code>${emailToken}</code>
                    </div>
                    <p style="text-align: center;">Or click the button below to verify automatically:</p>
                    <div style="text-align: center;">
                        <a href="${baseUrl}/api/users/verify-email/${emailToken}" class="button animate__animated animate__bounceIn" data-aos="zoom-in" data-aos-delay="600">
                            <i class="fas fa-envelope-open"></i> Verify Email Address
                        </a>
                    </div>
                </div>

                <div class="section animate__animated animate__fadeInLeft" data-aos="fade-up" data-aos-delay="700">
                    <h2><i class="fas fa-road"></i> What's Next?</h2>
                    <div class="features-list">
                        <ul>
                            <li><i class="fas fa-search"></i> Browse our extensive fleet of premium vehicles</li>
                            <li><i class="fas fa-calendar-check"></i> Book your perfect rental car with ease</li>
                            <li><i class="fas fa-handshake"></i> Enjoy seamless pickup and drop-off services</li>
                            <li><i class="fas fa-star"></i> Access exclusive member benefits and discounts</li>
                        </ul>
                    </div>
                    <p>If you didn't create this account, please ignore this email.</p>
                </div>

                <div class="footer animate__animated animate__fadeIn" data-aos="fade-in" data-aos-delay="800">
                    <p>Best regards,<br>The Silas Car Rentals Team</p>
                    <p><small>This verification link will expire in 24 hours for security reasons.</small></p>
                </div>
            </div>

            <!-- AOS Script -->
            <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
            <script>
                AOS.init();
            </script>
        </body>
        </html>
      `,
      text: `
        Welcome to Silas Car Rentals!

        Hello ${name},

        Thank you for signing up! We're thrilled to have you join our community.

        To complete your registration, please verify your email address using this token: ${emailToken}

        Or visit: ${baseUrl}/api/users/verify-email/${emailToken}

        What's next?
        - Browse our extensive fleet of premium vehicles
        - Book your perfect rental car with ease
        - Enjoy seamless pickup and drop-off services
        - Access exclusive member benefits and discounts

        If you didn't create this account, please ignore this email.

        Best regards,
        The Silas Car Rentals Team

        This verification link will expire in 24 hours for security reasons.
      `
    };
  },

  // Contact Form User Confirmation Template
  contactUserTemplate: (fullName) => {
    return {
      subject: 'Thank you for contacting Silas Car Rentals!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Thank You for Contacting Us</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f8f9fa; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Thank You for Contacting Silas Car Rentals!</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName},</h2>
            <p>We have received your message and will get back to you shortly.</p>
            <p>In the meantime, feel free to browse our fleet and find your perfect rental car.</p>
            <p><a href="https://silascarrentals.netlify.app" class="button">Browse Our Fleet</a></p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Silas Car Rentals Team</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Thank you for contacting Silas Car Rentals, ${fullName}!

        We have received your message and will get back to you shortly.

        In the meantime, feel free to browse our fleet and find your perfect rental car.

        Visit: https://silascarrentals.netlify.app

        Best regards,
        The Silas Car Rentals Team
      `
    };
  },

  // Contact Form Admin Notification Template
  contactAdminTemplate: (fullName, email, phoneNumber, message) => {
    return {
      subject: `New Contact Form Submission from ${fullName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f8f9fa; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            .info { margin-bottom: 15px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <p>You have received a new message from the contact form on your website.</p>
            <div class="info"><span class="label">Name:</span> ${fullName}</div>
            <div class="info"><span class="label">Email:</span> ${email}</div>
            <div class="info"><span class="label">Phone Number:</span> ${phoneNumber}</div>
            <div class="info"><span class="label">Message:</span></div>
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>Silas Car Rentals Website</p>
          </div>
        </body>
        </html>
      `,
      text: `
        New Contact Form Submission

        Name: ${fullName}
        Email: ${email}
        Phone Number: ${phoneNumber}
        Message:
        ${message}

        Best regards,
        Silas Car Rentals Website
      `
    };
  },

  // Login Notification Template
  loginNotificationTemplate: (name, loginTime, ipAddress = 'Unknown', location = 'Unknown') => {
    return {
      subject: 'Login Notification - Silas Car Rentals',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login Notification - Silas Car Rentals</title>
            <!-- Bootstrap CSS CDN -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <!-- Animate.css CDN for animations -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
            <!-- AOS (Animate On Scroll) CDN for scroll animations -->
            <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
            <!-- Font Awesome for icons -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                body {
                    font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 40px 20px;
                    color: #333;
                    min-height: 100vh;
                }
                .email-wrapper {
                    max-width: 680px;
                    margin: auto;
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    padding: 40px;
                    transform: scale(0.95);
                    transition: transform 0.5s ease;
                }
                .email-wrapper:hover {
                    transform: scale(1);
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #28a745;
                    margin: 0;
                    font-size: 32px;
                    font-weight: bold;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header p {
                    color: #666;
                    font-size: 18px;
                    margin-top: 10px;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section h2 {
                    color: #28a745;
                    font-size: 24px;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 5px;
                    position: relative;
                }
                .section h2::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 50px;
                    height: 2px;
                    background: linear-gradient(90deg, #28a745, #20c997);
                }
                .info-box {
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    border-left: 6px solid #2196f3;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .info-pair {
                    margin: 12px 0;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    transition: background 0.3s ease;
                }
                .info-pair:hover {
                    background: #e9ecef;
                }
                .label {
                    font-weight: 600;
                    display: inline-block;
                    width: 120px;
                    color: #555;
                }
                .value {
                    color: #222;
                    font-weight: 500;
                }
                .security-notice {
                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                    border-left: 6px solid #ffc107;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .security-notice h3 {
                    color: #856404;
                    margin-bottom: 10px;
                }
                .security-notice p {
                    color: #6c5b2a;
                }
                .button {
                    display: inline-block;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 15px 35px;
                    text-decoration: none;
                    border-radius: 25px;
                    margin: 20px 0;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: transform 0.3s ease;
                }
                .button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    font-size: 0.95em;
                    color: #777;
                    border-top: 2px solid #eee;
                    padding-top: 20px;
                }
                .animate-fade-in {
                    animation: fadeIn 1s ease-in;
                }
                .animate-slide-up {
                    animation: slideInUp 0.8s ease-out;
                }
                .animate-bounce-in {
                    animation: bounceIn 1s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper animate__animated animate__fadeInUp">
                <div class="header animate__animated animate__bounceIn" data-aos="zoom-in">
                    <h1><i class="fas fa-shield-alt"></i> Login Notification</h1>
                    <p>Account Activity Alert</p>
                </div>

                <div class="section animate__animated animate__fadeInLeft" data-aos="fade-up" data-aos-delay="200">
                    <h2><i class="fas fa-user-check"></i> Hello ${name}!</h2>
                    <p>We detected a successful login to your Silas Car Rentals account. If this was you, no action is needed.</p>
                </div>

                <div class="section animate__animated animate__fadeInRight" data-aos="fade-up" data-aos-delay="400">
                    <div class="info-box animate__animated animate__pulse" data-aos="flip-up" data-aos-delay="500">
                        <h3><i class="fas fa-info-circle"></i> Login Details</h3>
                        <div class="info-pair">
                            <span class="label"><i class="fas fa-clock"></i> Time:</span>
                            <span class="value">${loginTime}</span>
                        </div>
                        <div class="info-pair">
                            <span class="label"><i class="fas fa-globe"></i> IP Address:</span>
                            <span class="value">${ipAddress}</span>
                        </div>
                        <div class="info-pair">
                            <span class="label"><i class="fas fa-map-marker-alt"></i> Location:</span>
                            <span class="value">${location}</span>
                        </div>
                    </div>
                </div>

                <div class="section animate__animated animate__fadeInLeft" data-aos="fade-up" data-aos-delay="700">
                    <div class="security-notice animate__animated animate__shakeX" data-aos="fade-up" data-aos-delay="800">
                        <h3><i class="fas fa-exclamation-triangle"></i> Security Notice</h3>
                        <p>If this login wasn't you, please change your password immediately and contact our support team right away to secure your account.</p>
                    </div>
                    <p style="text-align: center;">Ready to explore our fleet? Continue your journey with Silas Car Rentals.</p>
                    <div style="text-align: center;">
                        <a href="https://silascarrentals.netlify.app" class="button animate__animated animate__bounceIn" data-aos="zoom-in" data-aos-delay="900">
                            <i class="fas fa-car"></i> Browse Our Fleet
                        </a>
                    </div>
                </div>

                <div class="footer animate__animated animate__fadeIn" data-aos="fade-in" data-aos-delay="1000">
                    <p>Best regards,<br>The Silas Car Rentals Security Team</p>
                    <p><small>For your security, we monitor all account activity. This is an automated notification.</small></p>
                </div>
            </div>

            <!-- AOS Script -->
            <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
            <script>
                AOS.init();
            </script>
        </body>
        </html>
      `,
      text: `
        Login Notification - Silas Car Rentals

        Hello ${name},

        We detected a successful login to your account.

        Login Details:
        - Time: ${loginTime}
        - IP Address: ${ipAddress}
        - Location: ${location}

        If this wasn't you, please change your password immediately and contact support.

        Ready to rent? Browse our fleet at https://silascarrentals.netlify.app

        Best regards,
        The Silas Car Rentals Security Team
      `
    };
  },

  // Password Reset OTP Template
  forgotPasswordTemplate: (name, otp) => {
    return {
      subject: 'Password Reset Request - Car Rental Service',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: #fff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; border: 3px solid #dc3545; }
                .otp-code { font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; margin: 10px 0; }
                .warning { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>We received a request to reset your password for your Car Rental Service account.</p>
                
                <div class="otp-box">
                    <h3>Your One-Time Password (OTP):</h3>
                    <div class="otp-code">${otp}</div>
                    <p><small>Enter this code to verify your identity</small></p>
                </div>
                
                <div class="warning">
                    <h3>⚠️ Important Security Information:</h3>
                    <ul>
                        <li>This OTP is valid for 10 minutes only</li>
                        <li>Never share this code with anyone</li>
                        <li>If you didn't request this reset, ignore this email</li>
                        <li>Contact support if you're experiencing repeated unauthorized attempts</li>
                    </ul>
                </div>
                
                <p>After verification, you'll be able to set a new password for your account.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Car Rental Service Security Team</p>
            </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Car Rental Service
        
        Hello ${name},
        
        We received a request to reset your password.
        
        Your One-Time Password (OTP): ${otp}
        
        This OTP is valid for 10 minutes only.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        The Car Rental Service Security Team
      `
    };
  },

  // Password Reset Confirmation Template
  passwordResetConfirmationTemplate: (name) => {
    return {
      subject: 'Password Successfully Reset - Car Rental Service',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
                .tips-box { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>✅ Password Reset Successful</h1>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                
                <div class="success-box">
                    <h3>🎉 Your password has been successfully reset!</h3>
                    <p>You can now log in to your Car Rental Service account with your new password.</p>
                </div>
                
                <div class="tips-box">
                    <h3>💡 Security Tips:</h3>
                    <ul>
                        <li>Use a strong, unique password</li>
                        <li>Don't share your password with anyone</li>
                        <li>Log out from public computers</li>
                        <li>Contact us if you notice any suspicious activity</li>
                    </ul>
                </div>
                
                <p>Ready to get back on the road? Log in and explore our latest vehicle collection!</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Car Rental Service Team</p>
            </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Successful - Car Rental Service
        
        Hello ${name},
        
        Your password has been successfully reset!
        
        You can now log in with your new password.
        
        Security Tips:
        - Use a strong, unique password
        - Don't share your password with anyone
        - Log out from public computers
        
        Best regards,
        The Car Rental Service Team
      `
    };
  },

  // Email Verification Success Template
  emailVerificationSuccessTemplate: (name) => {
    return {
      subject: 'Email Verified Successfully - Welcome Aboard!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verified</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
                .features-box { background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Email Verified Successfully!</h1>
            </div>
            <div class="content">
                <h2>Congratulations ${name}!</h2>
                
                <div class="success-box">
                    <h3>✅ Your email has been verified!</h3>
                    <p>Your Car Rental Service account is now fully activated and ready to use.</p>
                </div>
                
                <div class="features-box">
                    <h3>🚗 What you can do now:</h3>
                    <ul>
                        <li>Browse our premium vehicle collection</li>
                        <li>Book rentals instantly</li>
                        <li>Manage your bookings online</li>
                        <li>Access exclusive member discounts</li>
                        <li>Enjoy 24/7 customer support</li>
                    </ul>
                </div>
                
                <p style="text-align: center;">
                    <a href="https://silascarrentals.netlify.app" class="button">Start Browsing Vehicles</a>
                </p>
                
                <p>Thank you for choosing Car Rental Service. We look forward to serving you!</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Car Rental Service Team</p>
            </div>
        </body>
        </html>
      `,
      text: `
        Email Verified Successfully!
        
        Congratulations ${name}!
        
        Your email has been verified and your account is now fully activated.
        
        What you can do now:
        - Browse our premium vehicle collection
        - Book rentals instantly
        - Manage your bookings online
        - Access exclusive member discounts
        
        Thank you for choosing Car Rental Service!
        
        Best regards,
        The Car Rental Service Team
      `
    };
  },

  // Google Welcome Template
  googleWelcomeTemplate: (name) => {
    return {
      subject: 'Welcome to Car Rental Service - Google Account Connected!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome via Google</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4285f4 0%, #db4437 50%, #f4b400 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .google-badge { background: #4285f4; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 20px 0; }
                .features-box { background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; background: #4285f4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚗 Welcome to Car Rental Service!</h1>
                <div class="google-badge">
                    <strong>✓ Connected with Google</strong>
                </div>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Welcome! You've successfully signed up using your Google account. Your account is ready to use immediately!</p>
                
                <div class="features-box">
                    <h3>🎉 Your Account Benefits:</h3>
                    <ul>
                        <li>✅ <strong>Instant Access</strong> - No email verification needed</li>
                        <li>✅ <strong>Secure Login</strong> - Protected by Google's security</li>
                        <li>✅ <strong>Quick Booking</strong> - Start renting immediately</li>
                        <li>✅ <strong>Profile Sync</strong> - Your Google profile is automatically linked</li>
                    </ul>
                </div>
                
                <h3>🚀 Ready to Get Started?</h3>
                <p>Browse our extensive fleet and book your perfect rental car today!</p>
                
                <p style="text-align: center;">
                    <a href="https://silascarrentals.netlify.app" class="button">Browse Our Fleet</a>
                </p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Car Rental Service Team</p>
                <p><small>You signed up using Google. You can add a password later if you want additional login options.</small></p>
            </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Car Rental Service!
        
        Hello ${name},
        
        Welcome! You've successfully signed up using your Google account.
        
        Your account benefits:
        - Instant access - no email verification needed
        - Secure login protected by Google
        - Quick booking - start renting immediately
        - Profile sync with your Google account
        
        Ready to get started? Browse our fleet and book your perfect rental car!
        
        Best regards,
        The Car Rental Service Team
      `
    };
  },

  // Password Set Confirmation Template
  passwordSetConfirmationTemplate: (name) => {
    return {
      subject: 'Password Added Successfully - Silas Car Rental Service',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Set Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745 0%, #4285f4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-box { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
                .info-box { background: #e2e3e5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔐 Password Added Successfully!</h1>
            </div>
            <div class="content">
                <h2>Hello ${name}!</h2>
                
                <div class="success-box">
                    <h3>✅ Password Set Successfully!</h3>
                    <p>You can now log in using both Google and your email/password combination.</p>
                </div>
                
                <div class="info-box">
                    <h3>🔑 Your Login Options:</h3>
                    <ul>
                        <li><strong>Google Sign-In:</strong> Continue using your Google account</li>
                        <li><strong>Email & Password:</strong> Use your email and the password you just set</li>
                    </ul>
                </div>
                
                <p>Having multiple login options gives you more flexibility and ensures you can always access your account.</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Car Rental Service Team</p>
            </div>
        </body>
        </html>
      `,
      text: `
        Password Added Successfully!
        
        Hello ${name},
        
        Your password has been set successfully!
        
        You can now log in using both:
        - Google Sign-In (continue using your Google account)
        - Email & Password (use your email and new password)
        
        Having multiple login options gives you more flexibility.
        
        Best regards,
        The Car Rental Service Team
      `
    };
  },

  // Newsletter Template
  newsletterTemplate: (email, baseUrl = 'https://silascarrentals.netlify.app') => {
    const subject = 'Welcome to Silas Car Rentals Newsletter - Exclusive Deals & Updates';
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Silas Car Rentals Newsletter</title>
          <style>
              body { 
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  margin: 0; 
                  padding: 0; 
                  background-color: #f4f4f4;
              }
              .container { 
                  max-width: 700px; 
                  margin: 0 auto; 
                  background: #ffffff;
                  border-radius: 15px;
                  overflow: hidden;
                  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center;
                  position: relative;
              }
              .header::before {
                  content: '🚗';
                  font-size: 48px;
                  display: block;
                  margin-bottom: 10px;
              }
              .header h1 { 
                  margin: 0; 
                  font-size: 28px; 
                  font-weight: 700;
              }
              .header p {
                  margin: 10px 0 0 0;
                  opacity: 0.9;
                  font-size: 16px;
              }
              .content { 
                  padding: 40px 30px; 
              }
              .welcome-section {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .welcome-section h2 {
                  color: #1e3c72;
                  font-size: 24px;
                  margin-bottom: 15px;
              }
              .welcome-section p {
                  font-size: 16px;
                  color: #666;
                  margin-bottom: 20px;
              }
              .benefits-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin: 30px 0;
              }
              .benefit-card {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 10px;
                  text-align: center;
                  border-left: 4px solid #2a5298;
              }
              .benefit-icon {
                  font-size: 32px;
                  margin-bottom: 10px;
              }
              .benefit-title {
                  font-weight: 600;
                  color: #1e3c72;
                  margin-bottom: 5px;
              }
              .cta-section {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 10px;
                  margin: 30px 0;
              }
              .cta-button {
                  display: inline-block;
                  background: #ffffff;
                  color: #667eea;
                  padding: 15px 35px;
                  text-decoration: none;
                  border-radius: 25px;
                  font-weight: 600;
                  margin-top: 15px;
                  transition: transform 0.3s ease;
              }
              .cta-button:hover {
                  transform: translateY(-2px);
              }
              .exclusive-offer {
                  background: #fff3cd;
                  border: 1px solid #ffeaa7;
                  padding: 20px;
                  border-radius: 10px;
                  margin: 20px 0;
                  text-align: center;
              }
              .offer-code {
                  background: #2a5298;
                  color: white;
                  padding: 8px 16px;
                  border-radius: 5px;
                  font-weight: bold;
                  font-family: monospace;
                  letter-spacing: 1px;
              }
              .social-links {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
              }
              .social-links a {
                  display: inline-block;
                  margin: 0 10px;
                  color: #1e3c72;
                  text-decoration: none;
                  font-size: 14px;
              }
              .footer-note {
                  text-align: center;
                  margin-top: 20px;
                  color: #888;
                  font-size: 14px;
              }
              @media (max-width: 600px) {
                  .benefits-grid {
                      grid-template-columns: 1fr;
                  }
                  .header, .content {
                      padding: 20px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Welcome to Silas Car Rentals Newsletter</h1>
                  <p>Your gateway to exclusive deals and premium car rental experiences</p>
              </div>
              
              <div class="content">
                  <div class="welcome-section">
                      <h2>Welcome aboard, ${email}! 🎉</h2>
                      <p>Thank you for subscribing to the Silas Car Rentals newsletter. You're now part of an exclusive community that gets first access to our best deals, new vehicle launches, and insider tips for the perfect rental experience.</p>
                  </div>

                  <div class="exclusive-offer">
                      <h3>🎁 Welcome Exclusive Offer</h3>
                      <p>As a thank you for subscribing, enjoy <strong>15% OFF</strong> your first rental!</p>
                      <p>Use code: <span class="offer-code">WELCOME15</span></p>
                      <small>Valid for 30 days from subscription date</small>
                  </div>

                  <div class="benefits-grid">
                      <div class="benefit-card">
                          <div class="benefit-icon">💰</div>
                          <div class="benefit-title">Exclusive Deals</div>
                          <p>Get subscriber-only discounts and early access to promotions</p>
                      </div>
                      <div class="benefit-card">
                          <div class="benefit-icon">🚗</div>
                          <div class="benefit-title">New Fleet Alerts</div>
                          <p>Be the first to know about new luxury vehicles added to our fleet</p>
                      </div>
                      <div class="benefit-card">
                          <div class="benefit-icon">📍</div>
                          <div class="benefit-title">Location Updates</div>
                          <p>Discover new pickup locations and service areas</p>
                      </div>
                      <div class="benefit-card">
                          <div class="benefit-icon">📱</div>
                          <div class="benefit-title">Travel Tips</div>
                          <p>Receive expert advice on car rental and travel planning</p>
                      </div>
                  </div>

                  <div class="cta-section">
                      <h3>Ready to explore our fleet?</h3>
                      <p>Browse our premium selection of vehicles and find your perfect match for your next adventure.</p>
                      <a href="${baseUrl}" class="cta-button">Explore Fleet Now</a>
                  </div>

                  <div class="social-links">
                      <a href="#">Facebook</a> | 
                      <a href="#">Instagram</a> | 
                      <a href="https://www.linkedin.com/in/silas-onyekachi-572a4a179">LinkedIn</a> | 
                      <a href="https://wa.link/c73sw8">WhatsApp</a>
                  </div>

                  <div class="footer-note">
                      <p>You're receiving this email because you subscribed to the Silas Car Rentals newsletter.</p>
                      <p>If you no longer wish to receive these updates, you can <a href="${baseUrl}/unsubscribe" style="color: #667eea;">unsubscribe here</a>.</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
    const text = `
Welcome to Silas Car Rentals Newsletter!

Hi ${email},

Thank you for subscribing! You're now part of our exclusive community that gets first access to:
- 15% OFF your first rental (code: WELCOME15)
- Exclusive deals and promotions
- New vehicle alerts
- Travel tips and location updates
- Early access to special offers

Visit our website to explore our premium fleet: ${baseUrl}

Follow us on social media for daily updates:
Facebook, Instagram, Twitter, WhatsApp: +234-810-758-6167

Need help? Contact us anytime at support@silascarrentals.com

Best regards,
The Silas Car Rentals Team

---
You're receiving this email because you subscribed to our newsletter.
Unsubscribe: ${baseUrl}/unsubscribe
    `;
    return { subject, html, text };
  },

  // Unsubscribe Template
  unsubscribeTemplate: (name) => {
    return {
      subject: 'We’re Sorry to See You Go - Unsubscribe Confirmation',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Unsubscribe Confirmation</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>We're Sorry to See You Go!</h1>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>We're sorry to see you unsubscribe from our newsletter. Your feedback is important to us, and we would love to know how we can improve.</p>
                <p>If you have any questions or concerns, please feel free to reach out to our support team.</p>
                <p>Thank you for being a part of our community!</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Car Rental Service Team</p>
            </div>
        </body>
        </html>
      `,
      text: `
        We're Sorry to See You Go - Unsubscribe Confirmation
        
        Hello ${name},
        
        We're sorry to see you unsubscribe from our newsletter. Your feedback is important to us, and we would love to know how we can improve.
        
        If you have any questions or concerns, please feel free to reach out to our support team.
        
        Thank you for being a part of our community!
        
        Best regards,
        The Car Rental Service Team
      `
    };
  }

};

module.exports = emailTemplates;
