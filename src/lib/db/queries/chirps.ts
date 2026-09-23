import { db } from "../index.js";
import { NewChirp, chirps } from "../../../schema.js";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function allChirps(autherId?:string){
	if(autherId){
		const result = await db.select().from(chirps).where(eq(chirps.userId,autherId)).orderBy(sql`${chirps.createdAt} ASC`);
		return result;
	}
	const result = await db.select().from(chirps).orderBy(sql`${chirps.createdAt} ASC`);
	return result;


}


export async function getChirpById(id:string){
	const [result]=await db.select().from(chirps).where(eq(chirps.id,id));
	return result;

}

export async function getChirp(chirpId:string){

	const [result] = await db.select().from(chirps).where(eq(chirps.id,chirpId));
	return result;

}



export async function deleteChirp (chirpId:string){
	await db.delete(chirps).where(eq(chirps.id,chirpId));




}





