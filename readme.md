# Vintage Strava Map

Display your Strava activities on a beautiful vintage-style map.

## Setup Instructions

1. **Get Strava API Credentials**
   - Go to https://www.strava.com/settings/api
   - Create a new application
   - Note your Client ID and Client Secret

2. **Configure the Application**
   - Open `config.php`
   - Replace `YOUR_CLIENT_ID_HERE` with your Client ID
   - Replace `YOUR_CLIENT_SECRET_HERE` with your Client Secret

3. **Upload Files**
   - Upload all files to your web server
   - Ensure PHP sessions are enabled

4. **Test**
   - Visit `vintagemap.html`
   - Click "Connect with Strava"
   - Authorize the application
   - Select activities to display

## Features
- Connect with Strava OAuth
- Select multiple activities
- Display routes on vintage map
- Show elevation profiles
- Calculate statistics
- Responsive design

## Security Notes
- Never commit config.php with real credentials
- Use HTTPS in production
- Keep Client Secret secure

## Support
For issues or questions, please create an issue on GitHub.