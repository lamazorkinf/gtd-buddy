module.exports = {
  apps: [
    {
      name: 'gtd-mcp',
      script: 'dist/http.js',
      cwd: '/root/gtd-buddy/mcp-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Cargar variables de .env
      env_file: '.env',
      // Logs
      error_file: '/var/log/gtd-mcp/error.log',
      out_file: '/var/log/gtd-mcp/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
