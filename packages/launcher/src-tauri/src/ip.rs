use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
enum IpFamily {
    IPV4,
    IPV6,
}

#[derive(Debug, Clone, Serialize)]
pub struct NetInterface {
    name: String,
    family: IpFamily,
    ip: String,
}

impl From<(String, std::net::IpAddr)> for NetInterface {
    fn from(netifa: (String, std::net::IpAddr)) -> Self {
        let (name, ip) = netifa;
        let family = match ip {
            std::net::IpAddr::V4(_) => IpFamily::IPV4,
            std::net::IpAddr::V6(_) => IpFamily::IPV6,
        };
        let ip = ip.to_string();
        NetInterface { name, family, ip }
    }
}
