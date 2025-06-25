export default () => ({
  port: parseInt(process.env.PORT ?? '3000'),

  secret: process.env.SECRET,

  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432'),
    user: process.env.DATABASE_USENAME,
    pass: process.env.DATABASE_PWD,
    name: process.env.DATABASE_NAME,
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT ?? '587'),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  frontendUrl: process.env.FRONT_END_URL,
});
