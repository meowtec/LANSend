use clap::Parser;
use env_logger::Env;
use lansend_server::LansendServer;

/// Run Lansend server
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Output verbose information
    #[arg(short, long)]
    verbose: bool,

    /// Server port
    #[arg(short, long, default_value_t = 17133)]
    port: u16,
}

#[actix_web::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let log_level = if args.verbose { "debug" } else { "info" };

    env_logger::Builder::from_env(Env::default().default_filter_or(log_level)).init();

    LansendServer::new(args.port, std::env::temp_dir().join("lansend"))
        .run()
        .await?
        .await?;

    Ok(())
}
