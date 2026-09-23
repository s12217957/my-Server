import { db } from "../index.js";
import { refreshTokens } from "../../../schema.js";
import { eq,and,isNull } from "drizzle-orm";

export async function addRefreshToken(token:string, userId:string, expiresAt:Date){

	const [ans] = await db.insert(refreshTokens).values({token:token, userId:userId, expiresAt:expiresAt}).returning();
	return ans;


}


export async function checkToken (token:string){
	const [result] = await db.select().from(refreshTokens).where(and(eq(refreshTokens.token,token),isNull(refreshTokens.revokedAt))); 
	return result;



}

export async function revokeToken (token:string){
        await db.update(refreshTokens).set({revokedAt:new Date(), updatedAt:new Date()}).where(eq(refreshTokens.token,token));
	


}
