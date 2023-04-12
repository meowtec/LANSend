use clap::{ArgAction, Parser};
use lansend_server::LansendServer;

/// Run Lansend server
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Output verbose information
    #[arg(short, long, action = ArgAction::Count)]
    verbose: u8,

    /// Server port
    #[arg(short, long, default_value_t = 8080)]
    port: u16,
}

#[actix_web::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    println!("args: {:?}", args);

    env_logger::init();

    LansendServer::new(10221, std::env::temp_dir().join("airpost"))
        .run()
        .await?
        .await?;

    Ok(())
}
