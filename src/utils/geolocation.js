const axios = require('axios');

/**
 * Get location information from IP address using ipapi.co
 * @param {string} ipAddress - The IP address to geolocate
 * @returns {Promise<string|null>} - Location string (City, Country) or null if failed
 */
const getLocationFromIPIpapi = async (ipAddress) => {
  try {
    // Skip geolocation for localhost/private IPs
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return 'Local Network';
    }

    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data.city && response.data.country_name) {
      return `${response.data.city}, ${response.data.country_name}`;
    } else if (response.data && response.data.country_name) {
      return response.data.country_name;
    } else {
      return null;
    }
  } catch (error) {
    console.error('ipapi.co Geolocation error:', error.message);
    return null;
  }
};

/**
 * Get location information from IP address using ipinfo.io
 * @param {string} ipAddress - The IP address to geolocate
 * @returns {Promise<string|null>} - Location string (City, Country) or null if failed
 */
const getLocationFromIPIpinfo = async (ipAddress) => {
  try {
    if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      return 'Local Network';
    }

    // ipinfo.io free tier allows 50k requests/month, no token needed for basic info
    const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`, {
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data.city && response.data.country) {
      return `${response.data.city}, ${response.data.country}`;
    } else if (response.data && response.data.country) {
      return response.data.country;
    } else {
      return null;
    }
  } catch (error) {
    console.error('ipinfo.io Geolocation error:', error.message);
    return null;
  }
};

/**
 * Get location information from IP address with fallback to ipinfo.io
 * @param {string} ipAddress - The IP address to geolocate
 * @returns {Promise<string>} - Location string (City, Country) or fallback string
 */
const getLocationFromIP = async (ipAddress) => {
  let location = await getLocationFromIPIpapi(ipAddress);
  if (location) {
    return location;
  }
  // Fallback to ipinfo.io
  location = await getLocationFromIPIpinfo(ipAddress);
  if (location) {
    return location;
  }
  return 'Location Unavailable';
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
