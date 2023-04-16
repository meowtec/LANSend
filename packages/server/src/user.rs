use actix_session::{Session, SessionInsertError};
use actix_web::HttpRequest;
use serde::{Deserialize, Serialize};

const USER_INFO_SESSION_KEY: &str = "user_info";

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub id: String,
    pub user_name: String,
}

fn get_default_user_name_from_ua(ua: &str) -> Option<String> {
    let result = woothee::parser::Parser::new().parse(ua)?;
    Some(format!(
        "{} {}",
        result.os.replace("Windows", "Win"),
        result.name
    ))
}

impl User {
    pub fn new() -> Self {
        let id = nanoid::nanoid!(16);
        let user_name = id[0..3].to_string();

        User { id, user_name }
    }

    pub fn update(&mut self, user: User) {
        self.user_name = user.user_name;
    }

    pub fn insert_to_session(&self, session: &Session) -> Result<(), SessionInsertError> {
        session.insert(USER_INFO_SESSION_KEY, self)?;
        Ok(())
    }

    pub fn get_from_session(
        session: &Session,
        req: &HttpRequest,
    ) -> Result<User, SessionInsertError> {
        let user_option = session.get::<User>(USER_INFO_SESSION_KEY).unwrap_or(None);

        let user = match user_option {
            Some(user) => user,
            None => {
                let user_agent = req
                    .headers()
                    .get("User-Agent")
                    .and_then(|ua| ua.to_str().ok())
                    .unwrap_or_default();

                let mut new_user = User::new();
                if let Some(user_name) = get_default_user_name_from_ua(user_agent) {
                    new_user.user_name = user_name;
                }
                new_user.insert_to_session(session)?;
                new_user
            }
        };

        Ok(user)
    }
}
