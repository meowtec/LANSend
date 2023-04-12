use actix_session::{Session, SessionInsertError};
use serde::{Deserialize, Serialize};

const USER_INFO_SESSION_KEY: &str = "user_info";

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub id: String,
    pub user_name: String,
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

    pub fn get_from_session(session: &Session) -> Result<User, SessionInsertError> {
        let user_option = session.get::<User>(USER_INFO_SESSION_KEY).unwrap_or(None);

        let user = match user_option {
            Some(user) => user,
            None => {
                let new_user = User::new();
                new_user.insert_to_session(session)?;
                new_user
            }
        };

        Ok(user)
    }
}
