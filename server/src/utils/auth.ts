import jwt, { JwtPayload }  from 'jsonwebtoken';
import { Request } from 'express';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
const SECRET = process.env.JWT_SECRET_KEY || 'supersecretkey';
const expiration = '2h';

// Middleware to authenticate token
// verifies existing token and decodes user data
export const authenticateToken = ({ req }: any) => {
  let token = req.body.token || req.query.token || req.headers.authorization;
  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }
  if (!token) {
    return req;
  }
  try {
    const { data }: any = jwt.verify(token, process.env.JWT_SECRET_KEY || '', { maxAge: '2h' });
    req.user = data;
  } catch (err) {
    console.log('Invalid token');
  }
  return req; // return the request object with user data
};

export interface UserPayload {
  _id: string;
  email: string;
  username: string;
}
export interface AuthRequest extends Request {
  user?: UserPayload;
}

// create a JSON Web Token (JWT) for user authentication
// the token will be signed with the secret key and will expire in 2 hours
export function signToken(user: UserPayload): string {
  return jwt.sign({ data: user }, SECRET, { expiresIn: expiration });
}

export function authMiddleware({ req }: { req: AuthRequest }): AuthRequest {
  let token = req.headers.authorization;
  if (token && token.startsWith ('Bearer ')) {
    token = token.split(' ').pop()?.trim();
  }
  
if (!token) {
  return req;
}
  
try {
  const { data } = jwt.verify(token, SECRET) as JwtPayload & { data: UserPayload };
  req.user = data;
} catch (err) {
  console.log('Invalid token');
}
  return req;
}

// create a custom error class for authentication errors
// calls the GraphQLError constructor with the message 
// and sets the error code to 'UNAUTHENTICATED'
export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHENTICATED'
      }
    });
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
};