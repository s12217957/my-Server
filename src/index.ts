import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from'./config.js'

import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

import {createUser,deleteUsers,getUserByEmail} from "./lib/db/queries/users.js"
import {createChirp,allChirps,getChirpById} from "./lib/db/queries/chirps.js"
import {addRefreshToken,checkToken,revokeToken} from "./lib/db/queries/refreshToken.js"
import { hashPassword,checkPasswordHash } from "./auth.js";
import { makeJWT, validateJWT, getBearerToken, makeRefreshToken } from "./auth.js"


const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);




const app = express();
const PORT = 8080;

class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
    }
}

class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
    }
}

const handlerReadiness = async (req:Request,res:Response)=>{
	res.set("Content-Type","text/plain; charset=utf-8");
	res.send("OK")
};

const handlerPrint = async (req:Request,res:Response)=>{
	res.set("Content-Type","text/html; charset=utf-8");
	res.send(`<html>
  			<body>
    				<h1>Welcome, Chirpy Admin</h1>
    				<p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
  			</body>	
		  </html>`)
}

const handlerReset = async (req:Request,res:Response)=>{
	
	if(config.api.platform!=="dev") res.status(403).send("Forbidden")	
	await deleteUsers();
	config.api.fileserverHits = 0; 
        res.status(200).send("reset file serve hits & users deleted")

	

}


const handleAddChirp = async (req:Request,res:Response)=>{

	try{
		const ans = req.body;
		if(!ans.body){ res.status(400).send("the request does not has all required feild"); return; }
		if(ans.body.length>140) throw new BadRequestError("Chirp is too long. Max length is 140");
		const token = getBearerToken(req);
		if (!token) {
            		res.status(401).send("missing token");
           		return;
        	}
		const userId =  validateJWT(token , config.api.secret)
                const array = ans.body.split(" ");
                for (let i=0;i<array.length;i++){
                        if(array[i].toLowerCase()=="kerfuffle" || array[i].toLowerCase()=="sharbert" ||  array[i].toLowerCase()=="fornax")
                                array[i]="****";

                }
                ans.body = array.join(" ");
		const dataAddedToDB = await createChirp({body:ans.body,userId:userId});
		res.status(201).json(dataAddedToDB);
		
	}catch(err){
		res.status(401).send("Unauthorized");
		console.log(err);
	}


}


const handlerAddUser = async (req:Request,res:Response) => {
	try{
		const obj = req.body;
		if (!obj.email || !obj.password) throw Error ("the request does not has the required feild");
		const hashedPassword = await hashPassword(obj.password);
		const ans = await createUser({email:obj.email, hashedPassword});
		return res.status(201).json({
			id: ans.id,
			createdAt: ans.createdAt,
			updatedAt: ans.updatedAt,
			email: ans.email,
		});


	}catch(err){
		console.log(err);
	}


}


const handleAllChirps = async (req:Request,res:Response) => {
	const ans =await  allChirps();
	res.status(200).send(ans);




}


const handleGetChirpById = async (req:Request,res:Response) => {

	const id = req.params.chirpId as string;
	const ans = await getChirpById(id);
	if(!ans){
		res.status(404).send("Chirp not found");
		return;
	}
	res.status(200).send(ans);


}



function ErrorMiddleware (err: Error,req: Request,res: Response,next: NextFunction) {
	console.log(err);
	 if (err instanceof BadRequestError) {
            res.status(400).json({
            error: err.message
        });
        return;
    	}

    	if (err instanceof UnauthorizedError) {
            res.status(401).json({
            error: err.message
        });
        return;
    	}

    	if (err instanceof ForbiddenError) {
            res.status(403).json({
            error: err.message
        });
        return;
    	}

    	if (err instanceof NotFoundError) {
            res.status(404).json({
            error: err.message
        });
        return;
    	}


    res.status(500).json({
        error: "Something went wrong on our end"
    });



}


const middlewareLogResponses = (req:Request,res:Response,next:NextFunction) => {
	res.on("finish", () => {
	if(res.statusCode!==200) console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`)

	});
	next();
}


function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
	config.api.fileserverHits = config.api.fileserverHits +1;
	next();
}

const handleLogin = async (req: Request, res: Response) => {
  const obj = req.body;
  const email = obj.email;
  const password = obj.password;

  const user = await getUserByEmail(email);

  if (!user) {
    res.status(401).send("incorrect email");
    return;
  }

  const passwordMatches = await checkPasswordHash(
    password,
    user.hashedPassword
  );

  if (!passwordMatches) {
    res.status(401).send("incorrect password");
    return;
  }
  
  const accessToken =  makeJWT(user.id, 3600 , config.api.secret);
  const refToken = makeRefreshToken();  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate()+60);
  addRefreshToken(refToken,user.id,expiresAt)

  res.status(200).json({
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    token: accessToken,
    refreshToken: refToken
  });
};

const handleApiReset = async (req: Request, res: Response) => {

	const refToken = req.get("Authorization");
	if(!refToken) throw new Error ("Authorization header is required");
        const arr = refToken.split(" ");
        if(arr[0] != "Bearer") throw new Error ("Invalid Authorization header");
        const refreshToken = arr[1];
	const refRecord = await checkToken(refreshToken);
	if(!refRecord) {res.status(401).send("invalid refresh token"); return;}
	const accessToken = makeJWT(refRecord.userId,3600,config.api.secret)
	res.status(200).json({token:accessToken});
	
}


const handleRevoke = async (req: Request, res: Response) => {

	const refToken = req.get("Authorization");
        if(!refToken) throw new Error ("Authorization header is required");
        const arr = refToken.split(" ");
        if(arr[0] != "Bearer") throw new Error ("Invalid Authorization header");
        const refreshToken = arr[1];
        await revokeToken(refreshToken);
	res.status(204).send();




}

app.use(express.json());
app.use("/app",middlewareMetricsInc);
app.use("/app",express.static("./src/app"));
app.use(middlewareLogResponses);


app.get("/api/healthz",handlerReadiness);
app.get("/admin/metrics",handlerPrint);
app.get("/api/chirps",handleAllChirps)
app.get("/api/chirps/:chirpId",handleGetChirpById);

app.post("/admin/reset",handlerReset);
app.post("/api/users",handlerAddUser);
app.post("/api/chirps",handleAddChirp)
app.post("/api/login",handleLogin);
app.post("/api/refresh",handleApiReset);
app.post("/api/revoke",handleRevoke);

app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
