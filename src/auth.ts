import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string
): Promise<boolean> {
  return await argon2.verify(hash, password);
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;



export function makeJWT(userID: string, expiresIn: number, secret: string): string {
	const iat=Math.floor(Date.now()/1000);
	const exp= iat+expiresIn;

	const p : payload = {
        	iss:"chirpy",
        	sub:userID,
		iat:iat,
		exp:exp
	}

	return jwt.sign(p,secret);



}


export function validateJWT(tokenString: string, secret: string): string {
	try {
		const ans = jwt.verify(tokenString , secret);
		return ans.sub;
	}catch(err){
		throw new Error("invalid token")
	}



}



