import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from'./config.js'

import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

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
	config.api.fileserverHits = 0;
	res.set("Content-Type","text/plain; charset=utf-8");
        res.send(`Hits: ${config.api.fileserverHits}`)

}


const handlerValidateChirp = async (req:Request,res:Response)=>{
	
	const e = {error : "Something went wrong"}
	const f = {error : "Chirp is too long"}
	
	res.header("Content-Type", "application/json");
	try{
		const obj = req.body;
		if(!obj.body){res.status(400).send(JSON.stringify(e)); return;}
		if(obj.body.length>140){throw new BadRequestError("Chirp is too long. Max length is 140");}
		const array = obj.body.split(" ");
		for (let i=0;i<array.length;i++){
			if(array[i].toLowerCase()=="kerfuffle" || array[i].toLowerCase()=="sharbert" ||  array[i].toLowerCase()=="fornax")
				array[i]="****";
			
		}
		const newstr = array.join(" ");
		res.status(200).send(JSON.stringify({cleanedBody:newstr}));
	}
	catch(err){
		throw err;
	}

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



app.use(express.json());
app.use("/app",middlewareMetricsInc);
app.use("/app",express.static("./src/app"));
app.use(middlewareLogResponses);


app.get("/api/healthz",handlerReadiness);
app.get("/admin/metrics",handlerPrint);


app.post("/admin/reset",handlerReset);
app.post("/api/validate_chirp",handlerValidateChirp);

app.use(ErrorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
