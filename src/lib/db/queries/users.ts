import { db } from "../index.js";
import { NewUser, users } from "../../../schema.js";
import { eq } from "drizzle-orm";


export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}


export async function deleteUsers(){
	await db.delete(users);



}



export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return user;
}


export async function getUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));

  return user;
}


export async function editUser(userId:string, email:string ,password:string){
	const [result] = await db.update(users).set({email:email, hashedPassword:password}).where(eq(users.id,userId)).returning();
	return result;
}


export async function upgradeUser(userId:string){
	await db.update(users).set({isChirpyRed:true}).where(eq(users.id,userId));


}

