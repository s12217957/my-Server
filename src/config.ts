import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db",
};



process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  port: number;
};


type DBConfig = {
  url:string;
  migrationConfig: MigrationConfig;

}

export const config : {api: APIConfig; db:DBConfig;} =  {

  api:{
    fileserverHits:0,
    port:Number(process.env.PORT)
  },
  db:{
    url:process.env.DB_URL!,
    migrationConfig: migrationConfig
  }


}
