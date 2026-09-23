import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/lib/db",
};



process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  port: number;
  platform: string;
  secret: string;
  polka: string;
};


type DBConfig = {
  url:string;
  migrationConfig: MigrationConfig;

}

export const config : {api: APIConfig; db:DBConfig;} =  {

  api:{
    fileserverHits:0,
    port:Number(process.env.PORT),
    platform:process.env.PLATFORM!,
    secret:process.env.JWT_SECRET!,
    polka:process.env.POLKA_KEY!
  },
  db:{
    url:process.env.DB_URL!,
    migrationConfig: migrationConfig
  }


}
