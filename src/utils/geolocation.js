const axios = require('axios');

/**
 * Get location information from IP address
 * @param {string} ipAddress - The IP address to geolocate
 * @returns {Promise<string>} - Location string (City, Country)
 */
const getLocationFromIP = async (ipAddress) => {
  try {
    // Skip geolocation for localhost/private IPs
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return 'Local Network';
    }

    // Use ipapi.co for geolocation (free tier allows 1000 requests/day)
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data.city && response.data.country_name) {
      return `${response.data.city}, ${response.data.country_name}`;
    } else if (response.data && response.data.country_name) {
      return response.data.country_name;
    } else {
      return 'Unknown Location';
    }
  } catch (error) {
    console.error('Geolocation error:', error.message);
    return 'Location Unavailable';
  }
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP if multiple are present
    return forwarded.split(',')[0].trim();
  }

  // Check for other proxy headers
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address
  return req.connection.remoteAddress || req.socket.remoteAddress || req.ip || 'Unknown';
};

module.exports = {
  getLocationFromIP,
  getClientIP
};
