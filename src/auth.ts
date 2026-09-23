import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Request } from "express";
import { randomBytes } from "crypto";

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
		const ans = jwt.verify(tokenString , secret) as payload;
		if (!ans.sub) {
			throw new Error("JWT does not contain a subject");
		}

		return ans.sub;
	}catch(err){
		throw new Error("invalid token")
	}



}



export function getBearerToken(req: Request): string {

	const str = req.get("Authorization");
	if(!str)throw new Error ("Authorization header is required");
	const arr = str.split(" ");
	if(arr[0] != "Bearer")throw new Error ("Invalid Authorization header");
	return arr[1];
	

}


export function makeRefreshToken(): string {

	return randomBytes(32).toString("hex");

}






