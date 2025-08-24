import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export default { 
  env: {
    PORT: process.env.WEB_PORT || process.env.PORT || '3000'
  }
};
