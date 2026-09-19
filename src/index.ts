import express from "express";
import { Request, Response, NextFunction } from "express";
import { config } from'./config.js'

const app = express();
const PORT = 8080;

const handlerReadiness = async (req:Request,res:Response)=>{
	res.set("Content-Type","text/plain; charset=utf-8");
	res.send("OK")
};

const handlerPrint = async (req:Request,res:Response)=>{
	res.set("Content-Type","text/html; charset=utf-8");
	res.send(`<html>
  			<body>
    				<h1>Welcome, Chirpy Admin</h1>
    				<p>Chirpy has been visited ${config.fileserverHits} times!</p>
  			</body>	
		  </html>`)
}

const handlerReset = async (req:Request,res:Response)=>{
	config.fileserverHits = 0;
	res.set("Content-Type","text/plain; charset=utf-8");
        res.send(`Hits: ${config.fileserverHits}`)

}


const handlerValidateChirp = async (req:Request,res:Response)=>{
	let body="";
	const e = {error : "Something went wrong"}
	const f = {error : "Chirp is too long"}
	const g = {valid : true}
	req.on("data",(d)=>{body+=d;})
	req.on("end",()=>{
		res.header("Content-Type", "application/json");
		try{
			const obj = JSON.parse(body);
			if(!obj.body){res.status(400).send(JSON.stringify(e)); return;}
			if(obj.body.length>140){res.status(400).send(JSON.stringify(f)); return;}
			res.status(200).send(JSON.stringify(g));
		}
		catch(err){
			res.status(400).send(JSON.stringify(e))
		}

	})


}


const middlewareLogResponses = (req:Request,res:Response,next:NextFunction) => {
	res.on("finish", () => {
	if(res.statusCode!==200) console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`)

	});
	next();
}


function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
	config.fileserverHits = config.fileserverHits +1;
	next();
}

app.use("/app",middlewareMetricsInc);
app.use("/app",express.static("./src/app"));
app.use(middlewareLogResponses);


app.get("/api/healthz",handlerReadiness);
app.get("/admin/metrics",handlerPrint);


app.post("/admin/reset",handlerReset);
app.post("/api/validate_chirp",handlerValidateChirp)


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
