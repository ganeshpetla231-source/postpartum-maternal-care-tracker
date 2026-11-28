import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: env.swaggerTitle,
      version: env.swaggerVersion,
      description: env.swaggerDescription
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: 'Local development server'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

export const swaggerSpec = swaggerJsdoc(options);
