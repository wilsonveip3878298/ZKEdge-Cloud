export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER || 'sistema',
    password: process.env.DB_PASSWORD || 'sistema',
    name: process.env.DB_NAME || 'sistema',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  mqtt: {
    broker: process.env.MQTT_BROKER || 'tls://localhost:8883',
    username: process.env.MQTT_USERNAME || 'sistema',
    password: process.env.MQTT_PASSWORD || 'sistema',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
});
